import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(householdId: string) {
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

  async create(householdId: string, data: { name: string; cost: number; nextBillingDate?: string }) {
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

  async update(householdId: string, subId: string, data: { name?: string; cost?: number }) {
    return this.prisma.subscription.updateMany({
      where: { id: subId, householdId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.cost !== undefined && { cost: data.cost }),
      },
    });
  }

  async delete(householdId: string, subId: string) {
    return this.prisma.subscription.deleteMany({
      where: { id: subId, householdId },
    });
  }
}
