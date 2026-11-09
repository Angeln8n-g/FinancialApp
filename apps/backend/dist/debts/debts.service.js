"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DebtsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebtsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const events_gateway_1 = require("../events/events.gateway");
const client_1 = require("@prisma/client");
let DebtsService = DebtsService_1 = class DebtsService {
    prisma;
    notificationsService;
    eventsGateway;
    logger = new common_1.Logger(DebtsService_1.name);
    constructor(prisma, notificationsService, eventsGateway) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.eventsGateway = eventsGateway;
    }
    calculateOperationalDates(d, now = new Date()) {
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDay = now.getDate();
        let nextClosingDate = null;
        let daysUntilCutoff = null;
        if (d.cutoffDay && d.cutoffDay >= 1 && d.cutoffDay <= 31) {
            let year = currentYear;
            let month = currentMonth;
            if (currentDay > d.cutoffDay) {
                month += 1;
                if (month > 11) {
                    month = 0;
                    year += 1;
                }
            }
            const daysInTargetMonth = new Date(year, month + 1, 0).getDate();
            const safeDay = Math.min(d.cutoffDay, daysInTargetMonth);
            nextClosingDate = new Date(year, month, safeDay, 23, 59, 59);
            const diff = nextClosingDate.getTime() - now.getTime();
            daysUntilCutoff = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }
        let nextPaymentDueDate = null;
        let daysUntilPaymentDue = null;
        if (d.paymentDueDay && d.paymentDueDay >= 1 && d.paymentDueDay <= 31) {
            let year = currentYear;
            let month = currentMonth;
            if (currentDay > d.paymentDueDay) {
                month += 1;
                if (month > 11) {
                    month = 0;
                    year += 1;
                }
            }
            const daysInTargetMonth = new Date(year, month + 1, 0).getDate();
            const safeDay = Math.min(d.paymentDueDay, daysInTargetMonth);
            nextPaymentDueDate = new Date(year, month, safeDay, 23, 59, 59);
            const diff = nextPaymentDueDate.getTime() - now.getTime();
            daysUntilPaymentDue = Math.ceil(diff / (1000 * 60 * 60 * 24));
        }
        else if (d.dueDate) {
            nextPaymentDueDate = new Date(d.dueDate);
            const diff = nextPaymentDueDate.getTime() - now.getTime();
            daysUntilPaymentDue = Math.ceil(diff / (1000 * 60 * 60 * 24));
        }
        const alertDays = d.alertDaysBefore ?? 3;
        const isDueSoon = daysUntilPaymentDue !== null && daysUntilPaymentDue >= 0 && daysUntilPaymentDue <= alertDays;
        const isOverdue = daysUntilPaymentDue !== null && daysUntilPaymentDue < 0;
        let alertBadge = 'NORMAL';
        if (isOverdue)
            alertBadge = 'OVERDUE';
        else if (isDueSoon)
            alertBadge = 'DUE_SOON';
        return {
            nextClosingDate,
            daysUntilCutoff,
            nextPaymentDueDate,
            daysUntilPaymentDue,
            isDueSoon,
            isOverdue,
            alertBadge,
        };
    }
    async syncDebtReminder(householdId, debt) {
        try {
            const isPaidOff = debt.isPaidOff || Number(debt.remainingAmount) <= 0;
            if (isPaidOff) {
                await this.prisma.reminder.updateMany({
                    where: { debtId: debt.id, isPaid: false },
                    data: { isPaid: true },
                });
                return;
            }
            if (debt.autoAlert === false)
                return;
            const dates = this.calculateOperationalDates(debt);
            if (!dates.nextPaymentDueDate)
                return;
            const amount = debt.minimumPayment
                ? Number(debt.minimumPayment)
                : debt.monthlyTargetPayment
                    ? Number(debt.monthlyTargetPayment)
                    : Number(debt.remainingAmount);
            const title = `Vencimiento Pago: ${debt.contactName}`;
            const existing = await this.prisma.reminder.findFirst({
                where: { debtId: debt.id, isPaid: false },
            });
            if (existing) {
                await this.prisma.reminder.update({
                    where: { id: existing.id },
                    data: {
                        title,
                        amount,
                        dueDate: dates.nextPaymentDueDate,
                    },
                });
            }
            else {
                await this.prisma.reminder.create({
                    data: {
                        householdId,
                        debtId: debt.id,
                        title,
                        amount,
                        dueDate: dates.nextPaymentDueDate,
                        isPaid: false,
                    },
                });
            }
        }
        catch (e) {
            this.logger.warn(`Error sincronizando recordatorio para deuda ${debt.id}: ${e.message}`);
        }
    }
    async findAll(householdId) {
        const debts = await this.prisma.debt.findMany({
            where: { householdId },
            orderBy: [{ isPaidOff: 'asc' }, { remainingAmount: 'desc' }],
        });
        const now = new Date();
        return debts.map((d) => {
            const total = Number(d.totalAmount);
            const remaining = Number(d.remainingAmount);
            const paid = Math.max(0, total - remaining);
            const progressPercentage = total > 0 ? Math.round((paid / total) * 100) : 0;
            const isPaidOff = d.isPaidOff || remaining <= 0;
            let monthsRemaining = null;
            let daysRemaining = null;
            let suggestedMonthlyPayment = 0;
            if (d.targetPayoffDate) {
                const target = new Date(d.targetPayoffDate);
                const timeDiff = target.getTime() - now.getTime();
                daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
                const monthsDiff = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
                monthsRemaining = Math.max(1, monthsDiff);
                suggestedMonthlyPayment = remaining > 0 ? Math.ceil(remaining / monthsRemaining) : 0;
            }
            const operational = this.calculateOperationalDates(d, now);
            return {
                id: d.id,
                contactName: d.contactName,
                type: d.type,
                totalAmount: total,
                remainingAmount: remaining,
                paidAmount: paid,
                progressPercentage,
                isPaidOff,
                interestRate: Number(d.interestRate),
                dueDate: d.dueDate,
                targetPayoffDate: d.targetPayoffDate,
                monthlyTargetPayment: d.monthlyTargetPayment ? Number(d.monthlyTargetPayment) : null,
                mitigationStrategy: d.mitigationStrategy || client_1.MitigationStrategy.CUSTOM,
                notes: d.notes,
                monthsRemaining,
                daysRemaining,
                suggestedMonthlyPayment,
                cutoffDay: d.cutoffDay || null,
                paymentDueDay: d.paymentDueDay || null,
                minimumPayment: d.minimumPayment ? Number(d.minimumPayment) : null,
                alertDaysBefore: d.alertDaysBefore ?? 3,
                autoAlert: d.autoAlert !== false,
                ...operational,
            };
        });
    }
    async create(householdId, data) {
        if (data.totalAmount <= 0) {
            throw new common_1.BadRequestException('El monto total de la deuda debe ser mayor a cero');
        }
        const remaining = data.remainingAmount !== undefined ? data.remainingAmount : data.totalAmount;
        const created = await this.prisma.debt.create({
            data: {
                householdId,
                contactName: data.contactName.trim(),
                type: 'OWED_BY_ME',
                totalAmount: data.totalAmount,
                remainingAmount: remaining,
                interestRate: data.interestRate || 0,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                targetPayoffDate: data.targetPayoffDate ? new Date(data.targetPayoffDate) : null,
                monthlyTargetPayment: data.monthlyTargetPayment || null,
                mitigationStrategy: data.mitigationStrategy || client_1.MitigationStrategy.CUSTOM,
                notes: data.notes?.trim() || null,
                isPaidOff: remaining <= 0,
                cutoffDay: data.cutoffDay || null,
                paymentDueDay: data.paymentDueDay || null,
                minimumPayment: data.minimumPayment || null,
                alertDaysBefore: data.alertDaysBefore !== undefined ? data.alertDaysBefore : 3,
                autoAlert: data.autoAlert !== false,
            },
        });
        await this.syncDebtReminder(householdId, created);
        this.eventsGateway.emitHouseholdDataChanged(householdId, {
            type: 'DEBT_CREATED',
            debtId: created.id,
        });
        return created;
    }
    async update(householdId, debtId, data) {
        const debt = await this.prisma.debt.findFirst({
            where: { id: debtId, householdId },
        });
        if (!debt) {
            throw new common_1.NotFoundException('Deuda no encontrada');
        }
        const remaining = data.remainingAmount !== undefined ? data.remainingAmount : Number(debt.remainingAmount);
        const updated = await this.prisma.debt.update({
            where: { id: debtId },
            data: {
                ...(data.contactName !== undefined && { contactName: data.contactName.trim() }),
                ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
                ...(data.remainingAmount !== undefined && { remainingAmount: data.remainingAmount }),
                ...(data.interestRate !== undefined && { interestRate: data.interestRate }),
                ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
                ...(data.targetPayoffDate !== undefined && {
                    targetPayoffDate: data.targetPayoffDate ? new Date(data.targetPayoffDate) : null,
                }),
                ...(data.monthlyTargetPayment !== undefined && { monthlyTargetPayment: data.monthlyTargetPayment }),
                ...(data.mitigationStrategy !== undefined && { mitigationStrategy: data.mitigationStrategy }),
                ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
                ...(data.cutoffDay !== undefined && { cutoffDay: data.cutoffDay }),
                ...(data.paymentDueDay !== undefined && { paymentDueDay: data.paymentDueDay }),
                ...(data.minimumPayment !== undefined && { minimumPayment: data.minimumPayment }),
                ...(data.alertDaysBefore !== undefined && { alertDaysBefore: data.alertDaysBefore }),
                ...(data.autoAlert !== undefined && { autoAlert: data.autoAlert }),
                isPaidOff: data.isPaidOff !== undefined ? data.isPaidOff : remaining <= 0,
            },
        });
        await this.syncDebtReminder(householdId, updated);
        this.eventsGateway.emitHouseholdDataChanged(householdId, {
            type: 'DEBT_UPDATED',
            debtId: updated.id,
        });
        return updated;
    }
    async payDebt(householdId, debtId, data, currentUserId) {
        const { amount, accountId, notes } = data;
        if (amount <= 0) {
            throw new common_1.BadRequestException('El monto a abonar debe ser mayor a cero.');
        }
        const debt = await this.prisma.debt.findFirst({
            where: { id: debtId, householdId },
        });
        if (!debt) {
            throw new common_1.NotFoundException('Deuda no encontrada');
        }
        const currentRemaining = Number(debt.remainingAmount);
        if (currentRemaining <= 0) {
            throw new common_1.BadRequestException('Esta deuda ya se encuentra completamente liquidada.');
        }
        const newRemaining = Math.max(0, currentRemaining - amount);
        const isNowPaidOff = newRemaining === 0;
        const result = await this.prisma.$transaction(async (tx) => {
            if (accountId) {
                const account = await tx.account.findFirst({
                    where: { id: accountId, householdId },
                });
                if (!account) {
                    throw new common_1.NotFoundException('Cuenta de débito no encontrada.');
                }
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { decrement: amount } },
                });
                await tx.transaction.create({
                    data: {
                        householdId,
                        accountId,
                        type: client_1.TransactionType.EXPENSE,
                        amount,
                        description: `Abono Deuda: ${debt.contactName}${notes ? ` - ${notes}` : ''}`,
                        date: new Date(),
                        ...(currentUserId && { createdById: currentUserId }),
                    },
                });
            }
            const updatedDebt = await tx.debt.update({
                where: { id: debtId },
                data: {
                    remainingAmount: newRemaining,
                    isPaidOff: isNowPaidOff,
                },
            });
            if (isNowPaidOff) {
                await tx.reminder.updateMany({
                    where: { debtId, isPaid: false },
                    data: { isPaid: true },
                });
            }
            return updatedDebt;
        });
        await this.notificationsService.create(householdId, 'Abono a Deuda Registrado', `Se registró un abono de RD$${amount.toLocaleString()} a "${debt.contactName}". Saldo restante: RD$${newRemaining.toLocaleString()}.`);
        this.eventsGateway.emitHouseholdDataChanged(householdId, {
            type: 'DEBT_PAID',
            debtId,
            amount,
            isPaidOff: isNowPaidOff,
        });
        return result;
    }
    async delete(householdId, id) {
        const debt = await this.prisma.debt.findFirst({
            where: { id, householdId },
        });
        if (!debt) {
            throw new common_1.NotFoundException('Deuda no encontrada');
        }
        await this.prisma.reminder.deleteMany({
            where: { debtId: id },
        });
        await this.prisma.debt.delete({ where: { id } });
        this.eventsGateway.emitHouseholdDataChanged(householdId, {
            type: 'DEBT_DELETED',
            debtId: id,
        });
        return { message: 'Deuda eliminada correctamente' };
    }
};
exports.DebtsService = DebtsService;
exports.DebtsService = DebtsService = DebtsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        events_gateway_1.EventsGateway])
], DebtsService);
//# sourceMappingURL=debts.service.js.map