import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getExpenseDistribution(householdId: string) {
    const expenses = await this.prisma.transaction.findMany({
      where: {
        householdId,
        type: TransactionType.EXPENSE,
      },
      include: {
        category: true,
      },
    });

    const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

    const map = new Map<string, { name: string; icon: string; color: string; amount: number }>();

    for (const t of expenses) {
      const catId = t.categoryId || 'uncategorized';
      const catName = t.category?.name || 'Otros';
      const catIcon = t.category?.icon || '📦';
      const catColor = t.category?.color || '#94a3b8';
      const amount = Number(t.amount);

      if (map.has(catId)) {
        const item = map.get(catId)!;
        item.amount += amount;
      } else {
        map.set(catId, {
          name: catName,
          icon: catIcon,
          color: catColor,
          amount,
        });
      }
    }

    const items = Array.from(map.values()).map(item => ({
      ...item,
      percentage: totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0,
    }));

    items.sort((a, b) => b.amount - a.amount);

    return {
      totalExpense,
      categoriesDistribution: items,
    };
  }

  async generateCsv(householdId: string): Promise<string> {
    const transactions = await this.prisma.transaction.findMany({
      where: { householdId },
      include: {
        account: true,
        category: true,
      },
      orderBy: { date: 'desc' },
    });

    const headers = ['ID', 'Fecha', 'Tipo', 'Monto', 'Descripción', 'Cuenta', 'Categoría'];
    const rows = transactions.map(t => [
      t.id,
      t.date.toISOString().split('T')[0],
      t.type,
      Number(t.amount).toFixed(2),
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.account?.name || ''}"`,
      `"${t.category?.name || 'Varios'}"`,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}
