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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const events_gateway_1 = require("../events/events.gateway");
const currency_service_1 = require("../currency/currency.service");
const client_1 = require("@prisma/client");
const parental_control_helper_1 = require("../household/parental-control.helper");
let TransactionsService = class TransactionsService {
    prisma;
    eventsGateway;
    currencyService;
    constructor(prisma, eventsGateway, currencyService) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
        this.currencyService = currencyService;
    }
    convertAmount(amount, from, to) {
        if (!this.currencyService)
            return amount;
        return this.currencyService.convert(amount, from, to);
    }
    async findAllByHousehold(householdId, userId) {
        const childConfig = await parental_control_helper_1.ParentalControlHelper.getChildConfigIfDependent(this.prisma, householdId, userId);
        const whereClause = { householdId };
        if (childConfig && childConfig.childAccountId) {
            whereClause.OR = [
                { accountId: childConfig.childAccountId },
                { destinationAccountId: childConfig.childAccountId },
                { createdById: userId },
            ];
        }
        return this.prisma.transaction.findMany({
            where: whereClause,
            include: {
                account: true,
                destinationAccount: true,
                category: true,
                createdBy: {
                    select: { id: true, fullName: true, email: true, avatarUrl: true },
                },
            },
            orderBy: { date: 'desc' },
            take: 50,
        });
    }
    async create(householdId, dto, currentUserId) {
        const { accountId, destinationAccountId, categoryId, type, amount, description, date } = dto;
        if (amount <= 0) {
            throw new common_1.BadRequestException('El monto debe ser mayor que cero');
        }
        const sourceAccount = await this.prisma.account.findFirst({
            where: { id: accountId, householdId },
        });
        if (!sourceAccount) {
            throw new common_1.NotFoundException('Cuenta de origen no encontrada');
        }
        const childConfig = await parental_control_helper_1.ParentalControlHelper.getChildConfigIfDependent(this.prisma, householdId, currentUserId);
        if (childConfig) {
            if (childConfig.childAccountId &&
                sourceAccount.id !== childConfig.childAccountId &&
                !sourceAccount.name.toLowerCase().includes(childConfig.childEmail.toLowerCase())) {
                throw new common_1.ForbiddenException('Solo tienes acceso para operar con tu propia cuenta de niño.');
            }
            if (childConfig.isFrozen) {
                throw new common_1.BadRequestException(`🔒 Tu cuenta de niño está congelada temporalmente por control parental (${childConfig.parentEmail}). Consulta con tu padre/tutor.`);
            }
            if (type === client_1.TransactionType.EXPENSE) {
                if (amount > Number(sourceAccount.balance)) {
                    throw new common_1.BadRequestException(`No tienes saldo suficiente en tu cuenta de niño (Disponible: $${Number(sourceAccount.balance).toFixed(2)}).`);
                }
                if (childConfig.maxSingleTransaction > 0 && amount > childConfig.maxSingleTransaction) {
                    throw new common_1.BadRequestException(`🛡️ Control Parental: Esta compra ($${amount.toFixed(2)}) supera tu límite máximo por gasto de $${childConfig.maxSingleTransaction.toFixed(2)} supervisado por ${childConfig.parentEmail}. Solicita permiso o dinero extra a tu padre/tutor.`);
                }
                if (childConfig.maxDailySpend > 0 && this.prisma.transaction?.findMany) {
                    const now = new Date();
                    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const todayTxs = await this.prisma.transaction.findMany({
                        where: {
                            householdId,
                            accountId: sourceAccount.id,
                            type: client_1.TransactionType.EXPENSE,
                            isVoided: false,
                            date: { gte: startOfDay },
                        },
                    });
                    const spentToday = (todayTxs || []).reduce((sum, t) => sum + Number(t.amount), 0);
                    if (spentToday + amount > childConfig.maxDailySpend) {
                        throw new common_1.BadRequestException(`🛡️ Control Parental: Con este gasto superarías tu límite diario de $${childConfig.maxDailySpend.toFixed(2)} (Gastado hoy: $${spentToday.toFixed(2)}).`);
                    }
                }
            }
        }
        if (type === client_1.TransactionType.TRANSFER) {
            if (!destinationAccountId) {
                throw new common_1.BadRequestException('Se requiere cuenta de destino para transferencias');
            }
            const destAccount = await this.prisma.account.findFirst({
                where: { id: destinationAccountId, householdId },
            });
            if (!destAccount) {
                throw new common_1.NotFoundException('Cuenta de destino no encontrada');
            }
        }
        const txDate = date ? new Date(date) : new Date();
        const createdTx = await this.prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    householdId,
                    accountId,
                    destinationAccountId: type === client_1.TransactionType.TRANSFER ? destinationAccountId : null,
                    categoryId: categoryId || null,
                    createdById: currentUserId || null,
                    type,
                    amount,
                    description: description || null,
                    date: txDate,
                },
                include: {
                    account: true,
                    destinationAccount: true,
                    category: true,
                    createdBy: {
                        select: { id: true, fullName: true, email: true, avatarUrl: true },
                    },
                },
            });
            if (type === client_1.TransactionType.EXPENSE) {
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { decrement: amount } },
                });
                if (childConfig && childConfig.memberId && tx.allowance?.findFirst && tx.allowance?.update) {
                    const childAllowance = await tx.allowance.findFirst({
                        where: { householdId, memberId: childConfig.memberId },
                    });
                    if (childAllowance) {
                        await tx.allowance.update({
                            where: { id: childAllowance.id },
                            data: { spentAmount: { increment: amount } },
                        });
                    }
                }
                if (childConfig && childConfig.parentUserId && tx.notification?.create) {
                    await tx.notification.create({
                        data: {
                            userId: childConfig.parentUserId,
                            householdId,
                            title: '🛍️ Compra en Cuenta de Niño',
                            body: `${childConfig.childName} registró un gasto de $${amount.toFixed(2)} (${description || 'Compra infantil'}).`,
                            type: 'PARENTAL_CONTROL',
                        },
                    });
                }
            }
            else if (type === client_1.TransactionType.INCOME) {
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { increment: amount } },
                });
            }
            else if (type === client_1.TransactionType.TRANSFER && destinationAccountId) {
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { decrement: amount } },
                });
                await tx.account.update({
                    where: { id: destinationAccountId },
                    data: { balance: { increment: amount } },
                });
            }
            if (currentUserId && tx.auditLog?.create) {
                await tx.auditLog.create({
                    data: {
                        userId: currentUserId,
                        householdId,
                        action: 'CREATE_TRANSACTION',
                        details: `Registró un ${type === 'EXPENSE' ? 'gasto' : type === 'INCOME' ? 'ingreso' : 'traslado'} de $${amount} (${description || 'Sin descripción'})`,
                    },
                });
            }
            return transaction;
        });
        this.eventsGateway.notifyHouseholdChange(householdId, 'transaction', 'CREATE');
        return createdTx;
    }
    async importBankStatement(householdId, dto, currentUserId) {
        let targetAccount = null;
        if (dto.accountId) {
            targetAccount = await this.prisma.account.findFirst({
                where: { id: dto.accountId, householdId },
            });
        }
        if (!targetAccount) {
            targetAccount = await this.prisma.account.findFirst({
                where: { householdId },
                orderBy: { createdAt: 'asc' },
            });
        }
        if (!targetAccount) {
            throw new common_1.NotFoundException('No hay una cuenta activa para importar el extracto');
        }
        if (dto.transactions && Array.isArray(dto.transactions)) {
            const imported = [];
            let skippedCount = 0;
            for (const item of dto.transactions) {
                const itemAmount = Number(item.amount);
                if (isNaN(itemAmount) || itemAmount <= 0)
                    continue;
                const txDate = item.date ? new Date(item.date) : new Date();
                const startOfDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
                const endOfDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate(), 23, 59, 59, 999);
                const itemAccountId = item.accountId || targetAccount.id;
                const duplicate = await this.prisma.transaction.findFirst({
                    where: {
                        householdId,
                        accountId: itemAccountId,
                        amount: itemAmount,
                        type: item.type,
                        date: { gte: startOfDay, lte: endOfDay },
                        description: item.description,
                        isVoided: false,
                    },
                });
                if (duplicate) {
                    skippedCount++;
                    continue;
                }
                const created = await this.create(householdId, {
                    accountId: itemAccountId,
                    type: item.type,
                    amount: itemAmount,
                    description: item.description,
                    categoryId: item.categoryId,
                    date: txDate.toISOString(),
                }, currentUserId);
                imported.push(created);
            }
            return {
                success: true,
                message: `Se importaron ${imported.length} transacciones correctamente${skippedCount > 0 ? ` (${skippedCount} omitidas por duplicadas)` : ''}`,
                importedCount: imported.length,
                skippedCount,
            };
        }
        if (dto.rawContent) {
            const lines = dto.rawContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
            const imported = [];
            for (const line of lines) {
                const parts = line.split(/[;,]/);
                if (parts.length >= 2) {
                    const desc = parts[1]?.trim() || parts[0]?.trim();
                    const amountMatch = (parts[2] || parts[1] || '').match(/(\d+([.,]\d{1,2})?)/);
                    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 25.0;
                    if (amount > 0) {
                        const isNegative = (parts[2] || parts[1] || '').includes('-');
                        const type = isNegative ? client_1.TransactionType.EXPENSE : client_1.TransactionType.INCOME;
                        const tx = await this.create(householdId, {
                            accountId: targetAccount.id,
                            type,
                            amount,
                            description: `[Importado] ${desc}`,
                        }, currentUserId);
                        imported.push(tx);
                    }
                }
            }
            return {
                success: true,
                message: `Se importaron ${imported.length} transacciones en crudo con éxito`,
                importedCount: imported.length,
                skippedCount: 0,
            };
        }
        throw new common_1.BadRequestException('Se requieren transacciones estructuradas o rawContent');
    }
    async getSummary(householdId, requestedCurrency, userId) {
        const allAccounts = await this.prisma.account.findMany({
            where: { householdId },
        });
        const childConfig = await parental_control_helper_1.ParentalControlHelper.getChildConfigIfDependent(this.prisma, householdId, userId);
        const accounts = childConfig
            ? allAccounts.filter((a) => a.id === childConfig.childAccountId ||
                a.name.toLowerCase().includes(childConfig.childEmail.toLowerCase()))
            : allAccounts;
        const baseCurrency = (requestedCurrency || accounts[0]?.currency || 'USD').toUpperCase();
        if (this.currencyService) {
            await this.currencyService.refreshRates();
        }
        const totalBalance = accounts.reduce((acc, account) => {
            const converted = this.convertAmount(Number(account.balance), account.currency || 'USD', baseCurrency);
            return acc + converted;
        }, 0);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const daysInMonth = endOfMonth.getDate();
        const currentDay = now.getDate();
        const daysRemaining = Math.max(1, daysInMonth - currentDay + 1);
        const txWhere = {
            householdId,
            date: { gte: startOfMonth },
        };
        if (childConfig && childConfig.childAccountId) {
            txWhere.OR = [
                { accountId: childConfig.childAccountId },
                { destinationAccountId: childConfig.childAccountId },
            ];
        }
        const monthlyTransactions = await this.prisma.transaction.findMany({
            where: txWhere,
            include: {
                account: true,
            },
        });
        let monthlyIncome = 0;
        let monthlyExpense = 0;
        let todayExpense = 0;
        for (const t of monthlyTransactions) {
            if (t.isVoided)
                continue;
            const txCurrency = t.account?.currency || baseCurrency;
            const amountConverted = this.convertAmount(Number(t.amount), txCurrency, baseCurrency);
            if (t.type === client_1.TransactionType.INCOME || (childConfig && t.destinationAccountId === childConfig.childAccountId)) {
                monthlyIncome += amountConverted;
            }
            else if (t.type === client_1.TransactionType.EXPENSE) {
                monthlyExpense += amountConverted;
                if (new Date(t.date) >= startOfDay) {
                    todayExpense += amountConverted;
                }
            }
        }
        if (childConfig) {
            const dailyRemaining = Math.max(0, (childConfig.maxDailySpend || 25) - todayExpense);
            return {
                totalBalance: Math.round(totalBalance * 100) / 100,
                monthlyIncome: Math.round(monthlyIncome * 100) / 100,
                monthlyExpense: Math.round(monthlyExpense * 100) / 100,
                todayExpense: Math.round(todayExpense * 100) / 100,
                baseCurrency,
                accountsCount: accounts.length,
                isChildAccount: true,
                parentalControls: childConfig,
                safeToSpend: {
                    liquidBalance: Math.round(totalBalance * 100) / 100,
                    pendingCommitments: 0,
                    safeToSpendMonth: Math.round(totalBalance * 100) / 100,
                    safeToSpendDaily: Math.round(Math.min(totalBalance, dailyRemaining) * 100) / 100,
                    daysRemaining,
                    daysInMonth,
                    healthStatus: childConfig.isFrozen ? 'CRITICAL' : 'HEALTHY',
                    breakdown: {
                        pendingRemindersTotal: 0,
                        pendingSubscriptionsTotal: 0,
                        upcomingDebtsTotal: 0,
                    },
                },
            };
        }
        const liquidBalance = accounts
            .filter((a) => ['CASH', 'BANK_ACCOUNT', 'PAYROLL', 'SAVINGS'].includes(a.type))
            .reduce((acc, a) => {
            const bal = Math.max(0, Number(a.balance));
            return acc + this.convertAmount(bal, a.currency || 'USD', baseCurrency);
        }, 0);
        const pendingReminders = await this.prisma.reminder.findMany({
            where: {
                householdId,
                isPaid: false,
                dueDate: { lte: endOfMonth },
            },
        });
        const pendingRemindersTotal = pendingReminders.reduce((acc, r) => acc + Number(r.amount), 0);
        const reminderSubIds = new Set(pendingReminders.filter((r) => r.subscriptionId).map((r) => r.subscriptionId));
        const activeSubscriptions = await this.prisma.subscription.findMany({
            where: {
                householdId,
                isActive: true,
                nextBillingDate: { lte: endOfMonth },
            },
            include: {
                account: true,
            },
        });
        const pendingSubscriptionsTotal = activeSubscriptions
            .filter((s) => !reminderSubIds.has(s.id))
            .reduce((acc, s) => {
            const costConverted = this.convertAmount(Number(s.cost), s.account?.currency || 'USD', baseCurrency);
            return acc + costConverted;
        }, 0);
        const reminderDebtIds = new Set(pendingReminders.filter((r) => r.debtId).map((r) => r.debtId));
        const activeDebts = await this.prisma.debt.findMany({
            where: {
                householdId,
                isPaidOff: false,
                type: 'OWED_BY_ME',
            },
        });
        const upcomingDebtsTotal = activeDebts
            .filter((d) => !reminderDebtIds.has(d.id))
            .reduce((acc, d) => {
            const payment = Number(d.minimumPayment || d.monthlyTargetPayment || 0);
            return acc + payment;
        }, 0);
        const pendingCommitments = pendingRemindersTotal + pendingSubscriptionsTotal + upcomingDebtsTotal;
        const safeToSpendMonth = Math.max(0, liquidBalance - pendingCommitments);
        const safeToSpendDaily = Math.round((safeToSpendMonth / daysRemaining) * 100) / 100;
        let healthStatus = 'HEALTHY';
        if (safeToSpendMonth === 0 || liquidBalance < pendingCommitments) {
            healthStatus = 'CRITICAL';
        }
        else if (safeToSpendDaily < 15) {
            healthStatus = 'MODERATE';
        }
        return {
            totalBalance: Math.round(totalBalance * 100) / 100,
            monthlyIncome: Math.round(monthlyIncome * 100) / 100,
            monthlyExpense: Math.round(monthlyExpense * 100) / 100,
            baseCurrency,
            accountsCount: accounts.length,
            safeToSpend: {
                liquidBalance: Math.round(liquidBalance * 100) / 100,
                pendingCommitments: Math.round(pendingCommitments * 100) / 100,
                safeToSpendMonth: Math.round(safeToSpendMonth * 100) / 100,
                safeToSpendDaily,
                daysRemaining,
                daysInMonth,
                healthStatus,
                breakdown: {
                    pendingRemindersTotal: Math.round(pendingRemindersTotal * 100) / 100,
                    pendingSubscriptionsTotal: Math.round(pendingSubscriptionsTotal * 100) / 100,
                    upcomingDebtsTotal: Math.round(upcomingDebtsTotal * 100) / 100,
                },
            },
        };
    }
    async update(householdId, id, dto) {
        if (!dto.editReason || !dto.editReason.trim()) {
            throw new common_1.BadRequestException('Se requiere una razón/comentario obligatorio para editar la transacción');
        }
        const existing = await this.prisma.transaction.findFirst({
            where: { id, householdId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Transacción no encontrada');
        if (existing.isVoided) {
            throw new common_1.BadRequestException('No se puede editar una transacción anulada');
        }
        const oldAmount = Number(existing.amount);
        const newAmount = dto.amount !== undefined ? dto.amount : oldAmount;
        const oldAccountId = existing.accountId;
        const newAccountId = dto.accountId || oldAccountId;
        const updatedTx = await this.prisma.$transaction(async (tx) => {
            if (existing.type === client_1.TransactionType.EXPENSE) {
                if (oldAccountId === newAccountId) {
                    const diff = newAmount - oldAmount;
                    if (diff !== 0) {
                        await tx.account.update({
                            where: { id: oldAccountId },
                            data: { balance: { decrement: diff } },
                        });
                    }
                }
                else {
                    await tx.account.update({
                        where: { id: oldAccountId },
                        data: { balance: { increment: oldAmount } },
                    });
                    await tx.account.update({
                        where: { id: newAccountId },
                        data: { balance: { decrement: newAmount } },
                    });
                }
            }
            else if (existing.type === client_1.TransactionType.INCOME) {
                if (oldAccountId === newAccountId) {
                    const diff = newAmount - oldAmount;
                    if (diff !== 0) {
                        await tx.account.update({
                            where: { id: oldAccountId },
                            data: { balance: { increment: diff } },
                        });
                    }
                }
                else {
                    await tx.account.update({
                        where: { id: oldAccountId },
                        data: { balance: { decrement: oldAmount } },
                    });
                    await tx.account.update({
                        where: { id: newAccountId },
                        data: { balance: { increment: newAmount } },
                    });
                }
            }
            return tx.transaction.update({
                where: { id },
                data: {
                    ...(dto.amount !== undefined && { amount: newAmount }),
                    ...(dto.description !== undefined && { description: dto.description }),
                    ...(dto.categoryId !== undefined && { categoryId: dto.categoryId || null }),
                    ...(dto.accountId && { accountId: newAccountId }),
                    isEdited: true,
                    editReason: dto.editReason.trim(),
                    editedAt: new Date(),
                },
                include: {
                    account: true,
                    destinationAccount: true,
                    category: true,
                },
            });
        });
        this.eventsGateway.notifyHouseholdChange(householdId, 'transaction', 'UPDATE');
        return updatedTx;
    }
    async voidTransaction(householdId, id, dto) {
        if (!dto.voidReason || !dto.voidReason.trim()) {
            throw new common_1.BadRequestException('Se requiere un motivo obligatorio para anular el movimiento');
        }
        const existing = await this.prisma.transaction.findFirst({
            where: { id, householdId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Transacción no encontrada');
        if (existing.isVoided) {
            throw new common_1.BadRequestException('La transacción ya se encuentra anulada');
        }
        const amount = Number(existing.amount);
        const voidedTx = await this.prisma.$transaction(async (tx) => {
            if (existing.type === client_1.TransactionType.EXPENSE) {
                await tx.account.update({
                    where: { id: existing.accountId },
                    data: { balance: { increment: amount } },
                });
            }
            else if (existing.type === client_1.TransactionType.INCOME) {
                await tx.account.update({
                    where: { id: existing.accountId },
                    data: { balance: { decrement: amount } },
                });
            }
            else if (existing.type === client_1.TransactionType.TRANSFER && existing.destinationAccountId) {
                await tx.account.update({
                    where: { id: existing.accountId },
                    data: { balance: { increment: amount } },
                });
                await tx.account.update({
                    where: { id: existing.destinationAccountId },
                    data: { balance: { decrement: amount } },
                });
            }
            return tx.transaction.update({
                where: { id },
                data: {
                    isVoided: true,
                    voidReason: dto.voidReason.trim(),
                    voidedAt: new Date(),
                },
                include: {
                    account: true,
                    destinationAccount: true,
                    category: true,
                },
            });
        });
        this.eventsGateway.notifyHouseholdChange(householdId, 'transaction', 'VOID');
        return voidedTx;
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway,
        currency_service_1.CurrencyService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map