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
exports.PatrimonyService = exports.UpdateValuationDto = exports.UpdateAssetDto = exports.CreateAssetDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
class CreateAssetDto {
    name;
    type;
    value;
    purchasePrice;
    acquisitionDate;
    notes;
    debtId;
}
exports.CreateAssetDto = CreateAssetDto;
class UpdateAssetDto {
    name;
    type;
    purchasePrice;
    acquisitionDate;
    notes;
    debtId;
}
exports.UpdateAssetDto = UpdateAssetDto;
class UpdateValuationDto {
    value;
    notes;
    valuationDate;
}
exports.UpdateValuationDto = UpdateValuationDto;
let PatrimonyService = class PatrimonyService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getNetWorth(householdId) {
        const [assets, accounts, debts] = await Promise.all([
            this.prisma.asset.findMany({
                where: { householdId },
                include: {
                    debt: true,
                    valuations: {
                        orderBy: { valuationDate: 'desc' },
                        take: 5,
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.account.findMany({
                where: { householdId },
                orderBy: { balance: 'desc' },
            }),
            this.prisma.debt.findMany({
                where: { householdId, type: 'OWED_BY_ME' },
                orderBy: { remainingAmount: 'desc' },
            }),
        ]);
        const accountsTotal = accounts.reduce((acc, a) => acc + Number(a.balance), 0);
        const positiveAccountsBalance = accounts
            .filter((a) => Number(a.balance) > 0)
            .reduce((acc, a) => acc + Number(a.balance), 0);
        const assetsTotal = assets.reduce((acc, a) => acc + Number(a.value), 0);
        const totalAssets = Math.round((assetsTotal + Math.max(0, accountsTotal)) * 100) / 100;
        const liquidTypes = ['INVESTMENT', 'CRYPTO', 'CASH_OTHER'];
        const liquidAssets = Math.round((positiveAccountsBalance +
            assets
                .filter((a) => liquidTypes.includes(a.type))
                .reduce((acc, a) => acc + Number(a.value), 0)) *
            100) / 100;
        const fixedAssets = Math.round(assets
            .filter((a) => !liquidTypes.includes(a.type))
            .reduce((acc, a) => acc + Number(a.value), 0) * 100) / 100;
        const totalLiabilities = Math.round(debts.reduce((acc, d) => acc + Number(d.remainingAmount), 0) * 100) / 100;
        const netWorth = Math.round((totalAssets - totalLiabilities) * 100) / 100;
        const liquidNetWorth = Math.round((liquidAssets - totalLiabilities) * 100) / 100;
        const solvencyRatio = totalLiabilities > 0
            ? Math.round((totalAssets / totalLiabilities) * 100) / 100
            : totalAssets > 0
                ? 999
                : 1;
        const debtToAssetRatio = totalAssets > 0
            ? Math.round((totalLiabilities / totalAssets) * 1000) / 10
            : 0;
        const totalAppreciation = Math.round(assets.reduce((sum, a) => {
            if (a.purchasePrice != null) {
                return sum + (Number(a.value) - Number(a.purchasePrice));
            }
            return sum;
        }, 0) * 100) / 100;
        const categoryTotals = {
            REAL_ESTATE: 0,
            VEHICLE: 0,
            INVESTMENT: 0,
            CRYPTO: 0,
            CASH_ACCOUNTS: Math.max(0, accountsTotal),
            CASH_OTHER: 0,
        };
        assets.forEach((a) => {
            const typeKey = categoryTotals[a.type] !== undefined ? a.type : 'CASH_OTHER';
            categoryTotals[typeKey] += Number(a.value);
        });
        const assetAllocation = Object.entries(categoryTotals).map(([key, amount]) => {
            const percentage = totalAssets > 0 ? Math.round((amount / totalAssets) * 1000) / 10 : 0;
            return {
                type: key,
                amount: Math.round(amount * 100) / 100,
                percentage,
            };
        });
        const assetsList = assets.map((a) => {
            const val = Number(a.value);
            const purchase = a.purchasePrice != null ? Number(a.purchasePrice) : null;
            const appreciationAmount = purchase != null ? Math.round((val - purchase) * 100) / 100 : null;
            const appreciationPercentage = purchase != null && purchase > 0
                ? Math.round(((val - purchase) / purchase) * 1000) / 10
                : null;
            const debtRemaining = a.debt ? Number(a.debt.remainingAmount) : 0;
            const netEquity = Math.round((val - debtRemaining) * 100) / 100;
            return {
                id: a.id,
                name: a.name,
                type: a.type,
                value: val,
                purchasePrice: purchase,
                acquisitionDate: a.acquisitionDate,
                notes: a.notes,
                debtId: a.debtId,
                appreciationAmount,
                appreciationPercentage,
                linkedDebt: a.debt
                    ? {
                        id: a.debt.id,
                        contactName: a.debt.contactName,
                        remainingAmount: debtRemaining,
                        totalAmount: Number(a.debt.totalAmount),
                        interestRate: Number(a.debt.interestRate),
                    }
                    : null,
                netEquity,
                latestValuations: a.valuations.map((v) => ({
                    id: v.id,
                    value: Number(v.value),
                    notes: v.notes,
                    valuationDate: v.valuationDate,
                })),
                createdAt: a.createdAt,
                updatedAt: a.updatedAt,
            };
        });
        return {
            totalAssets,
            liquidAssets,
            fixedAssets,
            totalLiabilities,
            netWorth,
            liquidNetWorth,
            solvencyRatio,
            debtToAssetRatio,
            totalAppreciation,
            assetAllocation,
            assetsList,
            accountsList: accounts.map((a) => ({
                id: a.id,
                name: a.name,
                type: a.type,
                balance: Number(a.balance),
            })),
            liabilitiesList: debts.map((d) => ({
                id: d.id,
                name: d.contactName,
                value: Number(d.remainingAmount),
                totalAmount: Number(d.totalAmount),
                interestRate: Number(d.interestRate),
                targetPayoffDate: d.targetPayoffDate,
                isPaidOff: d.isPaidOff,
                hasLinkedAsset: assets.some((a) => a.debtId === d.id),
            })),
        };
    }
    async createAsset(householdId, data) {
        const valuationDate = data.acquisitionDate ? new Date(data.acquisitionDate) : new Date();
        return this.prisma.$transaction(async (tx) => {
            const asset = await tx.asset.create({
                data: {
                    householdId,
                    name: data.name,
                    type: data.type,
                    value: data.value,
                    purchasePrice: data.purchasePrice !== undefined ? data.purchasePrice : null,
                    acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : null,
                    notes: data.notes || null,
                    debtId: data.debtId || null,
                },
            });
            await tx.assetValuation.create({
                data: {
                    assetId: asset.id,
                    value: data.value,
                    notes: 'Valoración inicial al registrar el activo',
                    valuationDate,
                },
            });
            return asset;
        });
    }
    async updateAsset(householdId, assetId, data) {
        const existing = await this.prisma.asset.findFirst({
            where: { id: assetId, householdId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Activo no encontrado');
        }
        return this.prisma.asset.update({
            where: { id: assetId },
            data: {
                name: data.name !== undefined ? data.name : undefined,
                type: data.type !== undefined ? data.type : undefined,
                purchasePrice: data.purchasePrice !== undefined ? data.purchasePrice : undefined,
                acquisitionDate: data.acquisitionDate !== undefined
                    ? data.acquisitionDate
                        ? new Date(data.acquisitionDate)
                        : null
                    : undefined,
                notes: data.notes !== undefined ? data.notes : undefined,
                debtId: data.debtId !== undefined ? data.debtId : undefined,
            },
        });
    }
    async updateAssetValuation(householdId, assetId, data) {
        const existing = await this.prisma.asset.findFirst({
            where: { id: assetId, householdId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Activo no encontrado');
        }
        const valDate = data.valuationDate ? new Date(data.valuationDate) : new Date();
        return this.prisma.$transaction(async (tx) => {
            const valuation = await tx.assetValuation.create({
                data: {
                    assetId,
                    value: data.value,
                    notes: data.notes || 'Actualización de valor de mercado',
                    valuationDate: valDate,
                },
            });
            const updatedAsset = await tx.asset.update({
                where: { id: assetId },
                data: {
                    value: data.value,
                },
            });
            return {
                asset: updatedAsset,
                valuation,
            };
        });
    }
    async deleteAsset(householdId, assetId) {
        const existing = await this.prisma.asset.findFirst({
            where: { id: assetId, householdId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Activo no encontrado');
        }
        return this.prisma.asset.delete({
            where: { id: assetId },
        });
    }
    async getAssetValuations(householdId, assetId) {
        const existing = await this.prisma.asset.findFirst({
            where: { id: assetId, householdId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Activo no encontrado');
        }
        return this.prisma.assetValuation.findMany({
            where: { assetId },
            orderBy: { valuationDate: 'asc' },
        });
    }
};
exports.PatrimonyService = PatrimonyService;
exports.PatrimonyService = PatrimonyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PatrimonyService);
//# sourceMappingURL=patrimony.service.js.map