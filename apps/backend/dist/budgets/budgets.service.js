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
exports.BudgetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let BudgetsService = class BudgetsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProgress(householdId) {
        const budgets = await this.prisma.budget.findMany({
            where: { householdId },
            include: { category: true },
        });
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const totalDaysInMonth = endOfMonth.getDate();
        const currentDay = now.getDate();
        const daysRemaining = Math.max(1, totalDaysInMonth - currentDay + 1);
        const result = [];
        for (const b of budgets) {
            const spentTx = await this.prisma.transaction.aggregate({
                where: {
                    householdId,
                    categoryId: b.categoryId,
                    type: client_1.TransactionType.EXPENSE,
                    date: { gte: startOfMonth },
                    isVoided: false,
                },
                _sum: { amount: true },
            });
            const spentAmount = Number(spentTx._sum.amount || 0);
            const limitAmount = Number(b.limitAmount);
            const remainingAmount = limitAmount - spentAmount;
            const isOverbudget = spentAmount > limitAmount;
            const percentage = limitAmount > 0 ? Math.round((spentAmount / limitAmount) * 100) : 0;
            const dailyRemaining = remainingAmount > 0 ? Math.round((remainingAmount / daysRemaining) * 100) / 100 : 0;
            result.push({
                id: b.id,
                categoryId: b.categoryId,
                categoryName: b.category?.name || 'Categoría',
                categoryIcon: b.category?.icon || '📊',
                categoryColor: b.category?.color || '#10B981',
                limitAmount,
                spentAmount,
                remainingAmount,
                isOverbudget,
                percentage,
                dailyRemaining,
                daysRemaining,
            });
        }
        return result;
    }
    async create(householdId, data) {
        return this.prisma.budget.create({
            data: {
                householdId,
                categoryId: data.categoryId,
                limitAmount: data.limitAmount,
                startDate: new Date(),
            },
        });
    }
    async update(householdId, budgetId, data) {
        return this.prisma.budget.updateMany({
            where: { id: budgetId, householdId },
            data: { limitAmount: data.limitAmount },
        });
    }
    async delete(householdId, budgetId) {
        return this.prisma.budget.deleteMany({
            where: { id: budgetId, householdId },
        });
    }
};
exports.BudgetsService = BudgetsService;
exports.BudgetsService = BudgetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BudgetsService);
//# sourceMappingURL=budgets.service.js.map