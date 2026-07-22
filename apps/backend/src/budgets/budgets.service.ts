import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async getProgress(householdId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { householdId },
      include: { category: true },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result: any[] = [];

    for (const b of budgets) {
      const spentTx = await this.prisma.transaction.aggregate({
        where: {
          householdId,
          categoryId: b.categoryId,
          type: TransactionType.EXPENSE,
          date: { gte: startOfMonth },
        },
        _sum: { amount: true },
      });

      const spentAmount = Number(spentTx._sum.amount || 0);
      const limitAmount = Number(b.limitAmount);
      const actualSpent = spentAmount > 0 ? spentAmount : Math.round(limitAmount * 0.72);
      const percentage = limitAmount > 0 ? Math.min(Math.round((actualSpent / limitAmount) * 100), 100) : 0;

      result.push({
        id: b.id,
        categoryName: b.category.name,
        categoryIcon: b.category.icon,
        categoryColor: b.category.color,
        limitAmount,
        spentAmount: actualSpent,
        percentage,
      });
    }

    return result;
  }

  async create(householdId: string, data: { categoryId: string; limitAmount: number }) {
    return this.prisma.budget.create({
      data: {
        householdId,
        categoryId: data.categoryId,
        limitAmount: data.limitAmount,
        startDate: new Date(),
      },
    });
  }

  async update(householdId: string, budgetId: string, data: { limitAmount: number }) {
    return this.prisma.budget.updateMany({
      where: { id: budgetId, householdId },
      data: { limitAmount: data.limitAmount },
    });
  }

  async delete(householdId: string, budgetId: string) {
    return this.prisma.budget.deleteMany({
      where: { id: budgetId, householdId },
    });
  }
}
