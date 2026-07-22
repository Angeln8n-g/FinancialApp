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
exports.PatrimonyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PatrimonyService = class PatrimonyService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getNetWorth(householdId) {
        const assets = await this.prisma.asset.findMany({
            where: { householdId },
        });
        const accounts = await this.prisma.account.findMany({
            where: { householdId },
        });
        const accountsTotal = accounts.reduce((acc, a) => acc + Number(a.balance), 0);
        const assetsTotal = assets.reduce((acc, a) => acc + Number(a.value), 0);
        const totalAssets = assetsTotal + Math.max(accountsTotal, 0);
        const debts = await this.prisma.debt.findMany({
            where: { householdId, type: 'OWED_BY_ME' },
        });
        const totalLiabilities = debts.reduce((acc, d) => acc + Number(d.remainingAmount), 0);
        const netWorth = totalAssets - totalLiabilities;
        return {
            totalAssets,
            totalLiabilities,
            netWorth,
            assetsList: [
                ...assets.map(a => ({ id: a.id, name: a.name, type: a.type, value: Number(a.value) })),
                { id: 'acc-summary', name: 'Saldo en Cuentas Bancarias', type: 'CASH', value: accountsTotal },
            ],
            liabilitiesList: debts.map(d => ({ id: d.id, name: d.contactName, value: Number(d.remainingAmount) })),
        };
    }
    async createAsset(householdId, data) {
        return this.prisma.asset.create({
            data: {
                householdId,
                name: data.name,
                type: data.type,
                value: data.value,
            },
        });
    }
    async deleteAsset(householdId, assetId) {
        return this.prisma.asset.deleteMany({
            where: { id: assetId, householdId },
        });
    }
};
exports.PatrimonyService = PatrimonyService;
exports.PatrimonyService = PatrimonyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PatrimonyService);
//# sourceMappingURL=patrimony.service.js.map