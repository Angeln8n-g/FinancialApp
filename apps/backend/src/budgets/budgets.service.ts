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
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const totalDaysInMonth = endOfMonth.getDate();
    const currentDay = now.getDate();
    const daysRemaining = Math.max(1, totalDaysInMonth - currentDay + 1);

    const result: any[] = [];

    for (const b of budgets) {
      const spentTx = await this.prisma.transaction.aggregate({
        where: {
          householdId,
          categoryId: b.categoryId,
          type: TransactionType.EXPENSE,
          date: { gte: startOfMonth },
          isVoided: false,
        },
        _sum: { amount: true },
      });

      const spentAmount = Number(spentTx._sum.amount || 0);
      const limitAmount = Number(b.limitAmount);
      const remainingAmount = limitAmount - spentAmount;
      const isOverbudget = spentAmount > limitAmount;
      // Porcentaje real sin tope artificial de 100% para reflejar sobregiros
      const percentage = limitAmount > 0 ? Math.round((spentAmount / limitAmount) * 100) : 0;
      const dailyRemaining = remainingAmount > 0 ? Math.round((remainingAmount / daysRemaining) * 100) / 100 : 0;

      // Calcular monto mensual de suscripciones recurrentes comprometidas en esta categoría
      const recurringSubs = await this.prisma.subscription.findMany({
        where: {
          householdId,
          categoryId: b.categoryId,
          isActive: true,
        },
      });

      const committedRecurringAmount = recurringSubs.reduce((acc, sub) => {
        const cost = Number(sub.cost);
        if (sub.period === 'YEARLY') return acc + cost / 12;
        if (sub.period === 'WEEKLY') return acc + cost * 4;
        return acc + cost;
      }, 0);

      result.push({
        id: b.id,
        categoryId: b.categoryId,
        categoryName: b.category?.name || 'Categoría',
        categoryIcon: b.category?.icon || '📊',
        categoryColor: b.category?.color || '#10B981',
        limitAmount,
        spentAmount,
        remainingAmount,
        isOverbudget,
        percentage,
        dailyRemaining,
        daysRemaining,
        committedRecurringAmount: Math.round(committedRecurringAmount * 100) / 100,
        recurringSubscriptionsCount: recurringSubs.length,
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
