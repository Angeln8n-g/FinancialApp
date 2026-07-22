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
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AccountsService = class AccountsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllByHousehold(householdId) {
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
            },
        });
    }
    async update(householdId, accountId, dto) {
        await this.findOne(householdId, accountId);
        return this.prisma.account.update({
            where: { id: accountId },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.type && { type: dto.type }),
                ...(dto.balance !== undefined && { balance: dto.balance }),
                ...(dto.currency && { currency: dto.currency }),
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
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map