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
        return goals.map(g => {
            const target = Number(g.targetAmount);
            const current = Number(g.currentAmount);
            const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
            const remaining = Math.max(target - current, 0);
            let suggestedMonthly = 0;
            if (g.targetDate) {
                const monthsDiff = Math.max((g.targetDate.getFullYear() - now.getFullYear()) * 12 + (g.targetDate.getMonth() - now.getMonth()), 1);
                suggestedMonthly = Math.round(remaining / monthsDiff);
            }
            return {
                id: g.id,
                name: g.name,
                targetAmount: target,
                currentAmount: current,
                targetDate: g.targetDate,
                percentage,
                suggestedMonthly,
            };
        });
    }
    async create(householdId, data) {
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