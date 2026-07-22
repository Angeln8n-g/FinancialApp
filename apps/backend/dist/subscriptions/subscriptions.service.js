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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SubscriptionsService = class SubscriptionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(householdId) {
        const subscriptions = await this.prisma.subscription.findMany({
            where: { householdId, isActive: true },
            orderBy: { cost: 'desc' },
        });
        const items = subscriptions.map(s => ({
            id: s.id,
            name: s.name,
            cost: Number(s.cost),
            period: s.period,
            nextBillingDate: s.nextBillingDate,
        }));
        const totalMonthlyConsumption = items.reduce((acc, item) => acc + item.cost, 0);
        return {
            totalMonthlyConsumption,
            totalAnnualConsumption: totalMonthlyConsumption * 12,
            subscriptions: items,
        };
    }
    async create(householdId, data) {
        return this.prisma.subscription.create({
            data: {
                householdId,
                name: data.name,
                cost: data.cost,
                period: 'MONTHLY',
                nextBillingDate: data.nextBillingDate ? new Date(data.nextBillingDate) : new Date(Date.now() + 30 * 86400000),
            },
        });
    }
    async update(householdId, subId, data) {
        return this.prisma.subscription.updateMany({
            where: { id: subId, householdId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.cost !== undefined && { cost: data.cost }),
            },
        });
    }
    async delete(householdId, subId) {
        return this.prisma.subscription.deleteMany({
            where: { id: subId, householdId },
        });
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map