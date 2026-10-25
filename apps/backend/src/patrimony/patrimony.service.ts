import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto, UpdateAssetDto, UpdateValuationDto } from './patrimony.dto';

export { CreateAssetDto, UpdateAssetDto, UpdateValuationDto };

@Injectable()
export class PatrimonyService {
  constructor(private prisma: PrismaService) {}

  async getNetWorth(householdId: string) {
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
    const liquidAssets =
      Math.round(
        (positiveAccountsBalance +
          assets
            .filter((a) => liquidTypes.includes(a.type))
            .reduce((acc, a) => acc + Number(a.value), 0)) *
          100,
      ) / 100;

    const fixedAssets =
      Math.round(
        assets
          .filter((a) => !liquidTypes.includes(a.type))
          .reduce((acc, a) => acc + Number(a.value), 0) * 100,
      ) / 100;

    const totalLiabilities =
      Math.round(
        debts.reduce((acc, d) => acc + Number(d.remainingAmount), 0) * 100,
      ) / 100;

    const netWorth = Math.round((totalAssets - totalLiabilities) * 100) / 100;
    const liquidNetWorth = Math.round((liquidAssets - totalLiabilities) * 100) / 100;

    // Ratios financieros
    const solvencyRatio =
      totalLiabilities > 0
        ? Math.round((totalAssets / totalLiabilities) * 100) / 100
        : totalAssets > 0
        ? 999
        : 1;

    const debtToAssetRatio =
      totalAssets > 0
        ? Math.round((totalLiabilities / totalAssets) * 1000) / 10
        : 0;

    // Plusvalía / Depreciación Acumulada
    const totalAppreciation =
      Math.round(
        assets.reduce((sum, a) => {
          if (a.purchasePrice != null) {
            return sum + (Number(a.value) - Number(a.purchasePrice));
          }
          return sum;
        }, 0) * 100,
      ) / 100;

    // Distribución de Activos (Asset Allocation)
    const categoryTotals: Record<string, number> = {
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
      const percentage =
        totalAssets > 0 ? Math.round((amount / totalAssets) * 1000) / 10 : 0;
      return {
        type: key,
        amount: Math.round(amount * 100) / 100,
        percentage,
      };
    });

    // Listado enriquecido de activos
    const assetsList = assets.map((a) => {
      const val = Number(a.value);
      const purchase = a.purchasePrice != null ? Number(a.purchasePrice) : null;
      const appreciationAmount = purchase != null ? Math.round((val - purchase) * 100) / 100 : null;
      const appreciationPercentage =
        purchase != null && purchase > 0
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

  async createAsset(householdId: string, data: CreateAssetDto) {
    const valuationDate = data.acquisitionDate ? new Date(data.acquisitionDate) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const asset = await tx.asset.create({
        data: {
          name: data.name,
          type: data.type,
          value: data.value,
          purchasePrice: data.purchasePrice !== undefined ? data.purchasePrice : null,
          acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : null,
          notes: data.notes || null,
          household: { connect: { id: householdId } },
          ...(data.debtId ? { debt: { connect: { id: data.debtId } } } : {}),
        },
      });

      await tx.assetValuation.create({
        data: {
          value: data.value,
          notes: 'Valoración inicial al registrar el activo',
          valuationDate,
          asset: { connect: { id: asset.id } },
        },
      });

      return asset;
    });
  }

  async updateAsset(householdId: string, assetId: string, data: UpdateAssetDto) {
    const existing = await this.prisma.asset.findFirst({
      where: { id: assetId, householdId },
    });
    if (!existing) {
      throw new NotFoundException('Activo no encontrado');
    }

    return this.prisma.asset.update({
      where: { id: assetId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.purchasePrice !== undefined && { purchasePrice: data.purchasePrice }),
        ...(data.acquisitionDate !== undefined && {
          acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : null,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.debtId !== undefined && {
          debt: data.debtId ? { connect: { id: data.debtId } } : { disconnect: true },
        }),
      },
    });
  }

  async updateAssetValuation(householdId: string, assetId: string, data: UpdateValuationDto) {
    const existing = await this.prisma.asset.findFirst({
      where: { id: assetId, householdId },
    });
    if (!existing) {
      throw new NotFoundException('Activo no encontrado');
    }

    const valDate = data.valuationDate ? new Date(data.valuationDate) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const valuation = await tx.assetValuation.create({
        data: {
          value: data.value,
          notes: data.notes || 'Actualización de valor de mercado',
          valuationDate: valDate,
          asset: { connect: { id: assetId } },
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

  async deleteAsset(householdId: string, assetId: string) {
    const existing = await this.prisma.asset.findFirst({
      where: { id: assetId, householdId },
    });
    if (!existing) {
      throw new NotFoundException('Activo no encontrado');
    }

    return this.prisma.asset.delete({
      where: { id: assetId },
    });
  }

  async getAssetValuations(householdId: string, assetId: string) {
    const existing = await this.prisma.asset.findFirst({
      where: { id: assetId, householdId },
    });
    if (!existing) {
      throw new NotFoundException('Activo no encontrado');
    }

    return this.prisma.assetValuation.findMany({
      where: { assetId },
      orderBy: { valuationDate: 'asc' },
    });
  }
}
