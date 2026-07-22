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
exports.DebtsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DebtsService = class DebtsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(householdId) {
        const debts = await this.prisma.debt.findMany({
            where: { householdId },
            orderBy: { remainingAmount: 'desc' },
        });
        return debts.map(d => ({
            id: d.id,
            contactName: d.contactName,
            type: d.type,
            totalAmount: Number(d.totalAmount),
            remainingAmount: Number(d.remainingAmount),
            interestRate: Number(d.interestRate),
            dueDate: d.dueDate,
        }));
    }
    async create(householdId, data) {
        return this.prisma.debt.create({
            data: {
                householdId,
                contactName: data.contactName,
                type: 'OWED_BY_ME',
                totalAmount: data.totalAmount,
                remainingAmount: data.remainingAmount,
                interestRate: data.interestRate || 0,
            },
        });
    }
    async delete(householdId, debtId) {
        return this.prisma.debt.deleteMany({
            where: { id: debtId, householdId },
        });
    }
};
exports.DebtsService = DebtsService;
exports.DebtsService = DebtsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DebtsService);
//# sourceMappingURL=debts.service.js.map