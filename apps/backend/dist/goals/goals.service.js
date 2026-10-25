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
exports.GoalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let GoalsService = class GoalsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(householdId) {
        const goals = await this.prisma.savingsGoal.findMany({
            where: { householdId },
            orderBy: { createdAt: 'desc' },
        });
        const now = new Date();
        return goals.map((g) => {
            const target = Number(g.targetAmount);
            const current = Number(g.currentAmount);
            const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
            const remaining = Math.max(target - current, 0);
            let suggestedMonthly = 0;
            let daysRemaining = null;
            if (g.targetDate) {
                const targetD = new Date(g.targetDate);
                const timeDiff = targetD.getTime() - now.getTime();
                daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
                const monthsDiff = Math.max((targetD.getFullYear() - now.getFullYear()) * 12 + (targetD.getMonth() - now.getMonth()), 1);
                suggestedMonthly = remaining > 0 ? Math.round(remaining / monthsDiff) : 0;
            }
            return {
                id: g.id,
                name: g.name,
                targetAmount: target,
                currentAmount: current,
                remainingAmount: remaining,
                targetDate: g.targetDate,
                daysRemaining,
                percentage,
                isCompleted: current >= target,
                suggestedMonthly,
            };
        });
    }
    async create(householdId, data) {
        if (data.targetAmount <= 0) {
            throw new common_1.BadRequestException('El monto objetivo debe ser mayor a cero');
        }
        return this.prisma.savingsGoal.create({
            data: {
                householdId,
                name: data.name,
                targetAmount: data.targetAmount,
                currentAmount: data.currentAmount || 0,
                targetDate: data.targetDate ? new Date(data.targetDate) : null,
            },
        });
    }
    async update(householdId, goalId, data) {
        const goal = await this.prisma.savingsGoal.findFirst({
            where: { id: goalId, householdId },
        });
        if (!goal) {
            throw new common_1.NotFoundException('Meta de ahorro no encontrada');
        }
        return this.prisma.savingsGoal.update({
            where: { id: goalId },
            data: {
                ...(data.name !== undefined && { name: data.name.trim() }),
                ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
                ...(data.targetDate !== undefined && { targetDate: data.targetDate ? new Date(data.targetDate) : null }),
            },
        });
    }
    async contribute(householdId, goalId, data, currentUserId) {
        const { amount, accountId, notes } = data;
        if (amount <= 0) {
            throw new common_1.BadRequestException('El monto a aportar debe ser mayor a cero');
        }
        const goal = await this.prisma.savingsGoal.findFirst({
            where: { id: goalId, householdId },
        });
        if (!goal) {
            throw new common_1.NotFoundException('Meta de ahorro no encontrada');
        }
        return this.prisma.$transaction(async (tx) => {
            if (accountId) {
                const account = await tx.account.findFirst({
                    where: { id: accountId, householdId },
                });
                if (!account) {
                    throw new common_1.NotFoundException('Cuenta de origen no encontrada');
                }
                await tx.transaction.create({
                    data: {
                        householdId,
                        accountId,
                        type: client_1.TransactionType.EXPENSE,
                        amount,
                        description: notes || `Aporte a meta: ${goal.name}`,
                        date: new Date(),
                        createdById: currentUserId || null,
                    },
                });
                await tx.account.update({
                    where: { id: accountId },
                    data: {
                        balance: { decrement: amount },
                    },
                });
            }
            const updatedGoal = await tx.savingsGoal.update({
                where: { id: goalId },
                data: {
                    currentAmount: { increment: amount },
                },
            });
            return updatedGoal;
        });
    }
    async delete(householdId, goalId) {
        return this.prisma.savingsGoal.deleteMany({
            where: { id: goalId, householdId },
        });
    }
};
exports.GoalsService = GoalsService;
exports.GoalsService = GoalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GoalsService);
//# sourceMappingURL=goals.service.js.map