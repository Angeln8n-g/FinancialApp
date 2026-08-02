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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllowancesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AllowancesService = class AllowancesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(householdId) {
        const allowances = await this.prisma.allowance.findMany({
            where: { householdId },
            include: {
                member: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return allowances.map((a) => {
            const limit = Number(a.limitAmount);
            const spent = Number(a.spentAmount);
            const remaining = Math.max(0, limit - spent);
            const percentageUsed = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
            return {
                ...a,
                limitAmount: limit,
                spentAmount: spent,
                remainingAmount: remaining,
                percentageUsed,
            };
        });
    }
    async create(householdId, data) {
        return this.prisma.allowance.create({
            data: {
                householdId,
                memberId: data.memberId,
                title: data.title,
                limitAmount: data.limitAmount,
                spentAmount: 0,
                period: data.period || client_1.RecurrencePeriod.MONTHLY,
            },
        });
    }
    async recordExpense(householdId, id, amount) {
        const allowance = await this.prisma.allowance.findFirst({
            where: { id, householdId },
        });
        if (!allowance)
            throw new common_1.NotFoundException('Mesada no encontrada');
        return this.prisma.allowance.update({
            where: { id },
            data: {
                spentAmount: { increment: amount },
            },
        });
    }
    async disburse(householdId, id, data) {
        const allowance = await this.prisma.allowance.findFirst({
            where: { id, householdId },
            include: { member: { include: { user: true } } },
        });
        if (!allowance)
            throw new common_1.NotFoundException('Mesada no encontrada');
        const account = await this.prisma.account.findFirst({
            where: { id: data.accountId, householdId },
        });
        if (!account)
            throw new common_1.NotFoundException('Cuenta no encontrada');
        const disburseAmount = data.amount || Number(allowance.limitAmount);
        return this.prisma.$transaction(async (tx) => {
            await tx.transaction.create({
                data: {
                    householdId,
                    accountId: account.id,
                    type: client_1.TransactionType.EXPENSE,
                    amount: disburseAmount,
                    description: `Desembolso Mesada: ${allowance.title} (${allowance.member.user.fullName})`,
                    date: new Date(),
                },
            });
            await tx.account.update({
                where: { id: account.id },
                data: { balance: { decrement: disburseAmount } },
            });
            return { success: true, message: `Desembolso de $${disburseAmount} realizado desde ${account.name}` };
        });
    }
    async reset(householdId, id) {
        const allowance = await this.prisma.allowance.findFirst({
            where: { id, householdId },
        });
        if (!allowance)
            throw new common_1.NotFoundException('Mesada no encontrada');
        return this.prisma.allowance.update({
            where: { id },
            data: { spentAmount: 0 },
        });
    }
    async remove(id, householdId) {
        return this.prisma.allowance.deleteMany({
            where: { id, householdId },
        });
    }
};
exports.AllowancesService = AllowancesService;
exports.AllowancesService = AllowancesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AllowancesService);
//# sourceMappingURL=allowances.service.js.map