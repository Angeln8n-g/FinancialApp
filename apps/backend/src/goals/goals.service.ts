import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(householdId: string) {
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
        const monthsDiff = Math.max(
          (g.targetDate.getFullYear() - now.getFullYear()) * 12 + (g.targetDate.getMonth() - now.getMonth()),
          1,
        );
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

  async create(householdId: string, data: { name: string; targetAmount: number; currentAmount?: number; targetDate?: string }) {
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

  async delete(householdId: string, goalId: string) {
    return this.prisma.savingsGoal.deleteMany({
      where: { id: goalId, householdId },
    });
  }
}
