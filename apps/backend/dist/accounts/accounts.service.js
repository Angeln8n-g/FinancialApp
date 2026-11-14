"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AccountsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const events_gateway_1 = require("../events/events.gateway");
const debts_service_1 = require("../debts/debts.service");
const parental_control_helper_1 = require("../household/parental-control.helper");
const crypto = __importStar(require("crypto"));
let AccountsService = AccountsService_1 = class AccountsService {
    prisma;
    eventsGateway;
    debtsService;
    logger = new common_1.Logger(AccountsService_1.name);
    constructor(prisma, eventsGateway, debtsService) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
        this.debtsService = debtsService;
    }
    hashPassword(password) {
        const salt = crypto.randomBytes(16).toString('hex');
        const iterations = 100000;
        const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
        return `pbkdf2$${iterations}$${salt}$${hash}`;
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
        const account = await this.findOne(householdId, accountId, currentUserId);
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
    async findAllByHousehold(householdId, userId) {
        try {
            await this.processPendingPayroll(householdId);
        }
        catch (err) {
            this.logger.error(`Error al procesar nóminas automáticas en findAllByHousehold:`, err);
        }
        const accounts = await this.prisma.account.findMany({
            where: { householdId },
            include: {
                debts: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const childConfig = await parental_control_helper_1.ParentalControlHelper.getChildConfigIfDependent(this.prisma, householdId, userId);
        if (childConfig) {
            const childAccounts = accounts.filter((a) => a.id === childConfig.childAccountId ||
                a.name.toLowerCase().includes(childConfig.childEmail.toLowerCase()) ||
                a.name.toLowerCase().includes(`niño - ${childConfig.childName.split(' ')[0].toLowerCase()}`));
            return childAccounts.map((a) => ({
                ...a,
                isChildAccount: true,
                parentEmail: childConfig.parentEmail,
                childEmail: childConfig.childEmail,
                childName: childConfig.childName,
                parentalControls: childConfig,
            }));
        }
        const allChildConfigs = await parental_control_helper_1.ParentalControlHelper.getHouseholdParentalControls(this.prisma, householdId);
        return accounts.map((a) => {
            const matchedChild = allChildConfigs.find((c) => c.childAccountId === a.id ||
                (c.childEmail && a.name.toLowerCase().includes(c.childEmail.toLowerCase())));
            if (matchedChild) {
                return {
                    ...a,
                    isChildAccount: true,
                    parentEmail: matchedChild.parentEmail,
                    childEmail: matchedChild.childEmail,
                    childName: matchedChild.childName,
                    parentalControls: matchedChild,
                };
            }
            return a;
        });
    }
    async findOne(householdId, accountId, userId) {
        const account = await this.prisma.account.findFirst({
            where: { id: accountId, householdId },
            include: {
                debts: true,
            },
        });
        if (!account) {
            throw new common_1.NotFoundException('Cuenta no encontrada');
        }
        const childConfig = await parental_control_helper_1.ParentalControlHelper.getChildConfigIfDependent(this.prisma, householdId, userId);
        if (childConfig && account.id !== childConfig.childAccountId && !account.name.toLowerCase().includes(childConfig.childEmail.toLowerCase())) {
            throw new common_1.ForbiddenException('Las cuentas de niño solo tienen acceso a su propia cuenta infantil.');
        }
        return account;
    }
    async create(householdId, dto, currentUserId) {
        const callerChildConfig = await parental_control_helper_1.ParentalControlHelper.getChildConfigIfDependent(this.prisma, householdId, currentUserId);
        if (callerChildConfig && !dto.isChildAccount) {
            throw new common_1.ForbiddenException('Las cuentas de niño con control parental no pueden crear cuentas bancarias o tarjetas de adulto.');
        }
        if (dto.isChildAccount) {
            if (!dto.parentEmail || !dto.parentEmail.trim()) {
                throw new common_1.BadRequestException('Si es una cuenta para niño, debes ingresar el correo del padre o tutor que tendrá el control parental.');
            }
        }
        const isCreditCard = !dto.isChildAccount && dto.type === client_1.AccountType.CREDIT_CARD;
        const initialDebtAmount = dto.debtRemainingAmount !== undefined
            ? Number(dto.debtRemainingAmount)
            : (dto.debtTotalAmount !== undefined ? Number(dto.debtTotalAmount) : Math.abs(Number(dto.balance || 0)));
        const initialBalance = isCreditCard
            ? (initialDebtAmount > 0 ? -Math.abs(initialDebtAmount) : 0)
            : (dto.balance ?? 0.0);
        const cleanChildEmail = dto.childEmail?.trim().toLowerCase();
        const cleanParentEmail = dto.parentEmail?.trim().toLowerCase();
        const accountName = dto.isChildAccount
            ? (cleanChildEmail && !dto.name.toLowerCase().includes(cleanChildEmail)
                ? `${dto.name} (${cleanChildEmail})`
                : dto.name)
            : dto.name;
        const account = await this.prisma.account.create({
            data: {
                householdId,
                name: accountName,
                type: dto.isChildAccount ? client_1.AccountType.SAVINGS : dto.type,
                balance: initialBalance,
                currency: dto.currency || 'USD',
                payrollAmount: dto.isChildAccount ? null : (dto.payrollAmount ?? null),
                payrollFrequency: dto.isChildAccount ? null : (dto.payrollFrequency ?? null),
                payrollDay1: dto.isChildAccount ? null : (dto.payrollDay1 ?? null),
                payrollDay2: dto.isChildAccount ? null : (dto.payrollDay2 ?? null),
                payrollAutoDeposit: dto.isChildAccount ? false : (dto.payrollAutoDeposit ?? (dto.type === client_1.AccountType.PAYROLL)),
            },
        });
        if (dto.isChildAccount && cleanParentEmail) {
            try {
                let parentUser = await this.prisma.user?.findUnique?.({
                    where: { email: cleanParentEmail },
                });
                if (!parentUser && this.prisma.user?.create) {
                    parentUser = await this.prisma.user.create({
                        data: {
                            email: cleanParentEmail,
                            fullName: cleanParentEmail.split('@')[0],
                        },
                    });
                }
                if (parentUser && this.prisma.householdMember?.findUnique) {
                    const parentMem = await this.prisma.householdMember.findUnique({
                        where: {
                            userId_householdId: {
                                userId: parentUser.id,
                                householdId,
                            },
                        },
                    });
                    if (!parentMem && this.prisma.householdMember?.create) {
                        await this.prisma.householdMember.create({
                            data: {
                                userId: parentUser.id,
                                householdId,
                                role: 'ADMIN',
                                customTitle: '👨‍👩‍👧 Padre / Tutor (Control Parental)',
                            },
                        });
                    }
                }
                const targetChildEmail = cleanChildEmail || `nino.${account.id.substring(0, 6)}@hogariq.familiar`;
                const targetChildName = dto.childName?.trim() || dto.name.replace(/Cuenta\s*(de\s*)?Niño\s*-?\s*/i, '').trim() || 'Hijo/a';
                let childUser = await this.prisma.user?.findUnique?.({
                    where: { email: targetChildEmail },
                });
                const passwordHash = dto.childPassword ? this.hashPassword(dto.childPassword) : undefined;
                if (!childUser && this.prisma.user?.create) {
                    childUser = await this.prisma.user.create({
                        data: {
                            email: targetChildEmail,
                            fullName: targetChildName,
                            ...(passwordHash ? { passwordHash } : {}),
                        },
                    });
                }
                else if (childUser && passwordHash && !childUser.passwordHash && this.prisma.user?.update) {
                    childUser = await this.prisma.user.update({
                        where: { id: childUser.id },
                        data: { passwordHash, fullName: targetChildName || childUser.fullName },
                    });
                }
                if (childUser && this.prisma.householdMember) {
                    let childMember = await this.prisma.householdMember.findUnique?.({
                        where: {
                            userId_householdId: {
                                userId: childUser.id,
                                householdId,
                            },
                        },
                    });
                    const customTitle = `👦 Cuenta Infantil (Tutor: ${cleanParentEmail})`;
                    if (!childMember && this.prisma.householdMember.create) {
                        childMember = await this.prisma.householdMember.create({
                            data: {
                                userId: childUser.id,
                                householdId,
                                role: 'DEPENDENT',
                                customTitle,
                            },
                        });
                    }
                    else if (childMember && this.prisma.householdMember.update) {
                        childMember = await this.prisma.householdMember.update({
                            where: { id: childMember.id },
                            data: { role: 'DEPENDENT', customTitle },
                        });
                    }
                    if (childMember) {
                        await parental_control_helper_1.ParentalControlHelper.ensureChildSetup(this.prisma, {
                            householdId,
                            childUserId: childUser.id,
                            childEmail: targetChildEmail,
                            childName: targetChildName,
                            memberId: childMember.id,
                            parentEmail: cleanParentEmail,
                            parentUserId: parentUser?.id || currentUserId || '',
                            existingAccountId: account.id,
                            maxDailySpend: dto.maxDailySpend ?? 25,
                            maxSingleTransaction: dto.maxSingleTransaction ?? 15,
                            requireApprovalAbove: dto.requireApprovalAbove ?? 10,
                        });
                    }
                }
            }
            catch (err) {
                this.logger.warn(`Aviso al enlazar control parental para la cuenta ${account.id}: ${err}`);
            }
        }
        if (isCreditCard && this.debtsService) {
            const totalAmount = dto.debtTotalAmount ? Number(dto.debtTotalAmount) : Math.max(initialDebtAmount, 100);
            const remainingAmount = initialDebtAmount;
            await this.debtsService.create(householdId, {
                accountId: account.id,
                contactName: dto.name,
                totalAmount,
                remainingAmount,
                interestRate: dto.debtInterestRate ? Number(dto.debtInterestRate) : 0,
                cutoffDay: dto.debtCutoffDay ? Number(dto.debtCutoffDay) : undefined,
                paymentDueDay: dto.debtPaymentDueDay ? Number(dto.debtPaymentDueDay) : undefined,
                minimumPayment: dto.debtMinimumPayment ? Number(dto.debtMinimumPayment) : undefined,
                mitigationStrategy: dto.debtMitigationStrategy || client_1.MitigationStrategy.CUSTOM,
                targetPayoffDate: dto.debtTargetPayoffDate || undefined,
                monthlyTargetPayment: dto.debtMonthlyTargetPayment ? Number(dto.debtMonthlyTargetPayment) : undefined,
                alertDaysBefore: dto.debtAlertDaysBefore ?? 3,
                autoAlert: dto.debtAutoAlert !== false,
                notes: dto.debtNotes || `Tarjeta de crédito vinculada a cuenta ${account.name}`,
            });
        }
        this.eventsGateway.notifyHouseholdChange(householdId, 'account', 'CREATE');
        return this.findOne(householdId, account.id, currentUserId);
    }
    async update(householdId, accountId, dto, currentUserId) {
        await this.findOne(householdId, accountId, currentUserId);
        const updated = await this.prisma.account.update({
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
            include: {
                debts: true,
            },
        });
        if (updated.type === client_1.AccountType.CREDIT_CARD && updated.debts && updated.debts.length > 0 && this.debtsService) {
            const debtId = updated.debts[0].id;
            await this.debtsService.update(householdId, debtId, {
                ...(dto.name !== undefined && { contactName: dto.name }),
                ...(dto.debtTotalAmount !== undefined && { totalAmount: Number(dto.debtTotalAmount) }),
                ...(dto.debtRemainingAmount !== undefined && { remainingAmount: Number(dto.debtRemainingAmount) }),
                ...(dto.debtInterestRate !== undefined && { interestRate: Number(dto.debtInterestRate) }),
                ...(dto.debtCutoffDay !== undefined && { cutoffDay: Number(dto.debtCutoffDay) }),
                ...(dto.debtPaymentDueDay !== undefined && { paymentDueDay: Number(dto.debtPaymentDueDay) }),
                ...(dto.debtMinimumPayment !== undefined && { minimumPayment: Number(dto.debtMinimumPayment) }),
                ...(dto.debtMitigationStrategy !== undefined && { mitigationStrategy: dto.debtMitigationStrategy }),
                ...(dto.debtTargetPayoffDate !== undefined && { targetPayoffDate: dto.debtTargetPayoffDate }),
                ...(dto.debtMonthlyTargetPayment !== undefined && { monthlyTargetPayment: Number(dto.debtMonthlyTargetPayment) }),
                ...(dto.debtAlertDaysBefore !== undefined && { alertDaysBefore: Number(dto.debtAlertDaysBefore) }),
                ...(dto.debtAutoAlert !== undefined && { autoAlert: dto.debtAutoAlert }),
                ...(dto.debtNotes !== undefined && { notes: dto.debtNotes }),
            });
        }
        this.eventsGateway.notifyHouseholdChange(householdId, 'account', 'UPDATE');
        return this.findOne(householdId, accountId, currentUserId);
    }
    async delete(householdId, accountId, currentUserId) {
        const childConfig = await parental_control_helper_1.ParentalControlHelper.getChildConfigIfDependent(this.prisma, householdId, currentUserId);
        if (childConfig) {
            throw new common_1.ForbiddenException('Las cuentas de niño bajo control parental no pueden ser eliminadas por el niño.');
        }
        await this.findOne(householdId, accountId, currentUserId);
        const deleted = await this.prisma.account.delete({
            where: { id: accountId },
        });
        this.eventsGateway.notifyHouseholdChange(householdId, 'account', 'DELETE');
        return deleted;
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = AccountsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway,
        debts_service_1.DebtsService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map