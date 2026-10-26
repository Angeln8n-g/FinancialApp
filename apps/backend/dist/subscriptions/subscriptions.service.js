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
var SubscriptionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const events_gateway_1 = require("../events/events.gateway");
const client_1 = require("@prisma/client");
let SubscriptionsService = SubscriptionsService_1 = class SubscriptionsService {
    prisma;
    notificationsService;
    eventsGateway;
    logger = new common_1.Logger(SubscriptionsService_1.name);
    constructor(prisma, notificationsService, eventsGateway) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.eventsGateway = eventsGateway;
    }
    calculateNextBillingDate(currentDate, period) {
        const next = new Date(currentDate);
        if (period === client_1.RecurrencePeriod.YEARLY) {
            next.setFullYear(next.getFullYear() + 1);
        }
        else if (period === client_1.RecurrencePeriod.WEEKLY) {
            next.setDate(next.getDate() + 7);
        }
        else {
            next.setMonth(next.getMonth() + 1);
        }
        return next;
    }
    async deductSubscription(householdId, subscriptionId, currentUserId, now = new Date()) {
        const subscription = await this.prisma.subscription.findFirst({
            where: { id: subscriptionId, householdId },
            include: { account: true, category: true },
        });
        if (!subscription) {
            throw new common_1.NotFoundException('Suscripción no encontrada');
        }
        if (!subscription.accountId) {
            throw new common_1.BadRequestException('Esta suscripción no tiene una cuenta bancaria asignada para el cobro.');
        }
        const account = await this.prisma.account.findFirst({
            where: { id: subscription.accountId, householdId },
        });
        if (!account) {
            throw new common_1.NotFoundException('La cuenta asignada para el cobro no fue encontrada');
        }
        const cost = Number(subscription.cost);
        const balance = Number(account.balance);
        if (balance < cost) {
            this.logger.warn(`Saldo insuficiente para suscripción "${subscription.name}" en cuenta "${account.name}". Requerido: $${cost}, Disponible: $${balance}`);
            await this.prisma.subscription.update({
                where: { id: subscription.id },
                data: { lastDeductAttempt: now },
            });
            const members = await this.prisma.householdMember.findMany({
                where: { householdId },
                select: { userId: true },
            });
            for (const m of members) {
                await this.notificationsService.createNotification({
                    userId: m.userId,
                    householdId,
                    title: '⚠️ Fondos insuficientes para suscripción',
                    body: `No se pudo cobrar automáticamente "${subscription.name}" ($${cost.toFixed(2)}) de "${account.name}". Saldo disponible: $${balance.toFixed(2)}.`,
                    type: 'SUBSCRIPTION_FAILED_FUNDS',
                    metadata: {
                        subscriptionId: subscription.id,
                        accountId: account.id,
                        cost,
                        balance,
                    },
                });
            }
            this.eventsGateway.notifyHouseholdChange(householdId, 'notification', 'CREATE');
            return {
                success: false,
                reason: 'INSUFFICIENT_FUNDS',
                message: `Saldo insuficiente en "${account.name}". Se requieren $${cost.toFixed(2)}, pero solo hay $${balance.toFixed(2)} disponibles.`,
                requiredAmount: cost,
                currentBalance: balance,
            };
        }
        const nextDate = this.calculateNextBillingDate(subscription.nextBillingDate, subscription.period);
        const result = await this.prisma.$transaction(async (tx) => {
            let targetCategoryId = subscription.categoryId;
            if (!targetCategoryId) {
                let category = await tx.category.findFirst({
                    where: {
                        householdId,
                        name: { in: ['Servicios', 'Suscripciones', 'Streaming'], mode: 'insensitive' },
                    },
                });
                if (!category) {
                    category = await tx.category.create({
                        data: {
                            householdId,
                            name: 'Servicios',
                            icon: '📺',
                            color: '#3B82F6',
                        },
                    });
                }
                targetCategoryId = category.id;
            }
            const transaction = await tx.transaction.create({
                data: {
                    householdId,
                    accountId: account.id,
                    categoryId: targetCategoryId,
                    type: client_1.TransactionType.EXPENSE,
                    amount: cost,
                    description: `Pago automático suscripción: ${subscription.name}`,
                    date: now,
                    createdById: currentUserId || null,
                },
            });
            const updatedAccount = await tx.account.update({
                where: { id: account.id },
                data: {
                    balance: { decrement: cost },
                },
            });
            const updatedSub = await tx.subscription.update({
                where: { id: subscription.id },
                data: {
                    nextBillingDate: nextDate,
                    lastDeductAttempt: now,
                },
            });
            await tx.reminder.updateMany({
                where: {
                    subscriptionId: subscription.id,
                    isPaid: false,
                    dueDate: { lte: now },
                },
                data: { isPaid: true },
            });
            return { transaction, updatedAccount, updatedSub };
        });
        this.logger.log(`Cobro automático exitoso: $${cost} para "${subscription.name}" descontados de "${account.name}". Próximo cobro: ${nextDate.toISOString()}`);
        const members = await this.prisma.householdMember.findMany({
            where: { householdId },
            select: { userId: true },
        });
        for (const m of members) {
            await this.notificationsService.createNotification({
                userId: m.userId,
                householdId,
                title: 'Pago automático de suscripción',
                body: `Se debitaron $${cost.toFixed(2)} para "${subscription.name}" de la cuenta "${account.name}". Saldo restante: $${Number(result.updatedAccount.balance).toFixed(2)}.`,
                type: 'SUBSCRIPTION_DEDUCTED',
                metadata: {
                    subscriptionId: subscription.id,
                    accountId: account.id,
                    cost,
                    transactionId: result.transaction.id,
                    nextBillingDate: nextDate,
                },
            });
        }
        this.eventsGateway.notifyHouseholdChange(householdId, 'transaction', 'CREATE');
        this.eventsGateway.notifyHouseholdChange(householdId, 'account', 'UPDATE');
        this.eventsGateway.notifyHouseholdChange(householdId, 'subscription', 'UPDATE');
        this.eventsGateway.notifyHouseholdChange(householdId, 'budget', 'UPDATE');
        this.eventsGateway.notifyHouseholdChange(householdId, 'notification', 'CREATE');
        return {
            success: true,
            message: `Pago de $${cost.toFixed(2)} para "${subscription.name}" realizado con éxito.`,
            transaction: result.transaction,
            nextBillingDate: nextDate,
            remainingBalance: Number(result.updatedAccount.balance),
        };
    }
    async processPendingSubscriptions(householdId) {
        const now = new Date();
        const where = {
            isActive: true,
            autoDeduct: true,
            accountId: { not: null },
            nextBillingDate: { lte: now },
        };
        if (householdId) {
            where.householdId = householdId;
        }
        const pendingSubs = await this.prisma.subscription.findMany({
            where,
            include: { account: true },
        });
        let processedCount = 0;
        for (const sub of pendingSubs) {
            if (sub.lastDeductAttempt) {
                const lastAttempt = new Date(sub.lastDeductAttempt);
                const isSameDay = lastAttempt.getFullYear() === now.getFullYear() &&
                    lastAttempt.getMonth() === now.getMonth() &&
                    lastAttempt.getDate() === now.getDate();
                if (isSameDay && sub.account && Number(sub.account.balance) < Number(sub.cost)) {
                    continue;
                }
            }
            try {
                const res = await this.deductSubscription(sub.householdId, sub.id, undefined, now);
                if (res.success) {
                    processedCount++;
                }
            }
            catch (err) {
                this.logger.error(`Error procesando cobro automático de suscripción ${sub.id}:`, err);
            }
        }
        return processedCount;
    }
    async findAll(householdId) {
        try {
            await this.processPendingSubscriptions(householdId);
        }
        catch (err) {
            this.logger.error(`Error en catch-up de suscripciones para household ${householdId}:`, err);
        }
        const subscriptions = await this.prisma.subscription.findMany({
            where: { householdId, isActive: true },
            include: {
                account: {
                    select: { id: true, name: true, type: true, balance: true },
                },
                category: {
                    select: { id: true, name: true, icon: true, color: true },
                },
            },
            orderBy: { cost: 'desc' },
        });
        const items = subscriptions.map((s) => ({
            id: s.id,
            name: s.name,
            cost: Number(s.cost),
            period: s.period,
            nextBillingDate: s.nextBillingDate,
            autoDeduct: s.autoDeduct,
            accountId: s.accountId,
            account: s.account
                ? {
                    id: s.account.id,
                    name: s.account.name,
                    type: s.account.type,
                    balance: Number(s.account.balance),
                }
                : null,
            categoryId: s.categoryId,
            category: s.category
                ? {
                    id: s.category.id,
                    name: s.category.name,
                    icon: s.category.icon,
                    color: s.category.color,
                }
                : null,
        }));
        const totalMonthlyConsumption = items.reduce((acc, item) => {
            if (item.period === client_1.RecurrencePeriod.YEARLY) {
                return acc + item.cost / 12;
            }
            if (item.period === client_1.RecurrencePeriod.WEEKLY) {
                return acc + item.cost * 4;
            }
            return acc + item.cost;
        }, 0);
        return {
            totalMonthlyConsumption: Math.round(totalMonthlyConsumption * 100) / 100,
            totalAnnualConsumption: Math.round(totalMonthlyConsumption * 12 * 100) / 100,
            subscriptions: items,
        };
    }
    async create(householdId, data) {
        if (data.cost <= 0) {
            throw new common_1.BadRequestException('El costo de la suscripción debe ser mayor a cero.');
        }
        if (data.categoryId) {
            const category = await this.prisma.category.findFirst({
                where: { id: data.categoryId, householdId },
            });
            if (!category) {
                throw new common_1.BadRequestException('La categoría de presupuesto seleccionada no existe o no pertenece a este hogar.');
            }
        }
        return this.prisma.subscription.create({
            data: {
                householdId,
                name: data.name.trim(),
                cost: data.cost,
                period: data.period || client_1.RecurrencePeriod.MONTHLY,
                nextBillingDate: data.nextBillingDate
                    ? new Date(data.nextBillingDate)
                    : new Date(Date.now() + 30 * 86400000),
                autoDeduct: data.autoDeduct ?? false,
                accountId: data.accountId || null,
                categoryId: data.categoryId || null,
            },
            include: { account: true, category: true },
        });
    }
    async update(householdId, subId, data) {
        const existing = await this.prisma.subscription.findFirst({
            where: { id: subId, householdId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Suscripción no encontrada');
        }
        if (data.categoryId) {
            const category = await this.prisma.category.findFirst({
                where: { id: data.categoryId, householdId },
            });
            if (!category) {
                throw new common_1.BadRequestException('La categoría de presupuesto seleccionada no existe o no pertenece a este hogar.');
            }
        }
        return this.prisma.subscription.update({
            where: { id: subId },
            data: {
                ...(data.name !== undefined && { name: data.name.trim() }),
                ...(data.cost !== undefined && { cost: data.cost }),
                ...(data.period !== undefined && { period: data.period }),
                ...(data.nextBillingDate !== undefined && { nextBillingDate: new Date(data.nextBillingDate) }),
                ...(data.autoDeduct !== undefined && { autoDeduct: data.autoDeduct }),
                ...(data.accountId !== undefined && { accountId: data.accountId || null }),
                ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
            },
            include: { account: true, category: true },
        });
    }
    async delete(householdId, subId) {
        return this.prisma.subscription.deleteMany({
            where: { id: subId, householdId },
        });
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = SubscriptionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        events_gateway_1.EventsGateway])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map