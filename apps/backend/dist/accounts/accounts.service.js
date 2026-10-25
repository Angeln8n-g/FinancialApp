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
var AccountsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const events_gateway_1 = require("../events/events.gateway");
let AccountsService = AccountsService_1 = class AccountsService {
    prisma;
    eventsGateway;
    logger = new common_1.Logger(AccountsService_1.name);
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
    }
    isPayrollDue(account, now = new Date()) {
        if (!account.payrollAutoDeposit)
            return false;
        const amount = Number(account.payrollAmount || 0);
        if (amount <= 0)
            return false;
        if (!account.payrollFrequency)
            return false;
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDay = now.getDate();
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const lastDeposit = account.lastPayrollDeposit ? new Date(account.lastPayrollDeposit) : null;
        const hasDepositInCurrentMonth = lastDeposit &&
            lastDeposit.getFullYear() === currentYear &&
            lastDeposit.getMonth() === currentMonth;
        if (account.payrollFrequency === client_1.PayrollFrequency.MONTHLY) {
            const targetDay = Math.min(account.payrollDay1 || 30, lastDayOfMonth);
            if (currentDay < targetDay) {
                return false;
            }
            return !hasDepositInCurrentMonth;
        }
        if (account.payrollFrequency === client_1.PayrollFrequency.BIWEEKLY) {
            const day1 = Math.min(account.payrollDay1 || 15, 15);
            const day2 = Math.min(account.payrollDay2 || 30, lastDayOfMonth);
            if (currentDay >= day1 && currentDay <= 15) {
                const depositedInPeriod1 = hasDepositInCurrentMonth && (lastDeposit?.getDate() || 0) <= 15;
                return !depositedInPeriod1;
            }
            if (currentDay >= day2) {
                const depositedInPeriod2 = hasDepositInCurrentMonth && (lastDeposit?.getDate() || 0) > 15;
                return !depositedInPeriod2;
            }
            return false;
        }
        return false;
    }
    async executePayrollDeposit(account, currentUserId, now = new Date()) {
        const amount = Number(account.payrollAmount);
        const result = await this.prisma.$transaction(async (tx) => {
            let category = await tx.category.findFirst({
                where: {
                    householdId: account.householdId,
                    name: { in: ['Nómina', 'Nomina', 'Salario', 'Sueldo'], mode: 'insensitive' },
                },
            });
            if (!category) {
                category = await tx.category.create({
                    data: {
                        householdId: account.householdId,
                        name: 'Nómina',
                        icon: '💼',
                        color: '#10B981',
                    },
                });
            }
            const freqLabel = account.payrollFrequency === client_1.PayrollFrequency.BIWEEKLY ? 'quincenal' : 'mensual';
            const transaction = await tx.transaction.create({
                data: {
                    householdId: account.householdId,
                    accountId: account.id,
                    categoryId: category.id,
                    type: client_1.TransactionType.INCOME,
                    amount,
                    description: `Ingreso automático de nómina ${freqLabel} (${account.name})`,
                    date: now,
                    createdById: currentUserId || null,
                },
            });
            const updatedAccount = await tx.account.update({
                where: { id: account.id },
                data: {
                    balance: { increment: amount },
                    lastPayrollDeposit: now,
                },
            });
            return { transaction, updatedAccount };
        });
        this.logger.log(`Abono automático de nómina aplicado: $${amount} a cuenta ${account.name} (${account.id})`);
        this.eventsGateway.notifyHouseholdChange(account.householdId, 'transaction', 'CREATE');
        this.eventsGateway.notifyHouseholdChange(account.householdId, 'account', 'UPDATE');
        return result;
    }
    async processPendingPayroll(householdId) {
        const where = {
            type: client_1.AccountType.PAYROLL,
            payrollAutoDeposit: true,
            payrollAmount: { gt: 0 },
        };
        if (householdId) {
            where.householdId = householdId;
        }
        const payrollAccounts = await this.prisma.account.findMany({ where });
        let processedCount = 0;
        const now = new Date();
        for (const acc of payrollAccounts) {
            if (this.isPayrollDue(acc, now)) {
                try {
                    await this.executePayrollDeposit(acc, undefined, now);
                    processedCount++;
                }
                catch (err) {
                    this.logger.error(`Error procesando nómina automática para cuenta ${acc.id}:`, err);
                }
            }
        }
        return processedCount;
    }
    async manualPayrollDeposit(householdId, accountId, currentUserId) {
        const account = await this.findOne(householdId, accountId);
        const amount = Number(account.payrollAmount || 0);
        if (amount <= 0) {
            throw new common_1.BadRequestException('Esta cuenta no tiene configurado un monto de nómina válido.');
        }
        const { transaction, updatedAccount } = await this.executePayrollDeposit(account, currentUserId, new Date());
        return {
            message: `Nómina de $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} acreditada exitosamente.`,
            transaction,
            account: updatedAccount,
        };
    }
    async findAllByHousehold(householdId) {
        try {
            await this.processPendingPayroll(householdId);
        }
        catch (err) {
            this.logger.error(`Error al procesar nóminas automáticas en findAllByHousehold:`, err);
        }
        return this.prisma.account.findMany({
            where: { householdId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(householdId, accountId) {
        const account = await this.prisma.account.findFirst({
            where: { id: accountId, householdId },
        });
        if (!account) {
            throw new common_1.NotFoundException('Cuenta no encontrada');
        }
        return account;
    }
    async create(householdId, dto) {
        return this.prisma.account.create({
            data: {
                householdId,
                name: dto.name,
                type: dto.type,
                balance: dto.balance ?? 0.0,
                currency: dto.currency || 'USD',
                payrollAmount: dto.payrollAmount ?? null,
                payrollFrequency: dto.payrollFrequency ?? null,
                payrollDay1: dto.payrollDay1 ?? null,
                payrollDay2: dto.payrollDay2 ?? null,
                payrollAutoDeposit: dto.payrollAutoDeposit ?? (dto.type === client_1.AccountType.PAYROLL),
            },
        });
    }
    async update(householdId, accountId, dto) {
        await this.findOne(householdId, accountId);
        return this.prisma.account.update({
            where: { id: accountId },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.type !== undefined && { type: dto.type }),
                ...(dto.balance !== undefined && { balance: dto.balance }),
                ...(dto.currency !== undefined && { currency: dto.currency }),
                ...(dto.payrollAmount !== undefined && { payrollAmount: dto.payrollAmount }),
                ...(dto.payrollFrequency !== undefined && { payrollFrequency: dto.payrollFrequency }),
                ...(dto.payrollDay1 !== undefined && { payrollDay1: dto.payrollDay1 }),
                ...(dto.payrollDay2 !== undefined && { payrollDay2: dto.payrollDay2 }),
                ...(dto.payrollAutoDeposit !== undefined && { payrollAutoDeposit: dto.payrollAutoDeposit }),
            },
        });
    }
    async delete(householdId, accountId) {
        await this.findOne(householdId, accountId);
        return this.prisma.account.delete({
            where: { id: accountId },
        });
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = AccountsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map