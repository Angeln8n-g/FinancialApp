import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatrimonyService {
  constructor(private prisma: PrismaService) {}

  async getNetWorth(householdId: string) {
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

  async createAsset(householdId: string, data: { name: string; type: string; value: number }) {
    return this.prisma.asset.create({
      data: {
        householdId,
        name: data.name,
        type: data.type,
        value: data.value,
      },
    });
  }

  async deleteAsset(householdId: string, assetId: string) {
    return this.prisma.asset.deleteMany({
      where: { id: assetId, householdId },
    });
  }
}
