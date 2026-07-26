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

  async generatePdfReport(householdId: string): Promise<string> {
    const household = await this.prisma.household.findUnique({ where: { id: householdId } });
    const dist = await this.getExpenseDistribution(householdId);
    const transactions = await this.prisma.transaction.findMany({
      where: { householdId },
      include: { category: true, account: true },
      orderBy: { date: 'desc' },
      take: 20,
    });

    const incomeSum = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
    const expenseSum = dist.totalExpense;
    const net = incomeSum - expenseSum;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Informe Financiero - ${household?.name || 'HogarIQ'}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; margin: 0; }
    .header { text-align: center; border-bottom: 2px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 30px; }
    .title { font-size: 28px; font-weight: bold; color: #c084fc; margin: 0; }
    .subtitle { color: #94a3b8; font-size: 14px; margin-top: 5px; }
    .kpi-container { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 15px; }
    .kpi-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; flex: 1; text-align: center; }
    .kpi-title { font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; }
    .kpi-value { font-size: 24px; font-weight: bold; margin-top: 8px; }
    .green { color: #34d399; } .red { color: #f43f5e; } .purple { color: #c084fc; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; background: #1e293b; border-radius: 12px; overflow: hidden; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #334155; font-size: 13px; }
    th { background: #0f172a; color: #a78bfa; font-size: 11px; text-transform: uppercase; }
    .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">🏠 HogarIQ - Informe Financiero Ejecutivo</div>
    <div class="subtitle">${household?.name || 'Hogar'} • Generado el ${new Date().toLocaleDateString('es-ES')}</div>
  </div>

  <div class="kpi-container">
    <div class="kpi-card">
      <div class="kpi-title">Ingresos Totales</div>
      <div class="kpi-value green">+$${incomeSum.toFixed(2)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Gastos Totales</div>
      <div class="kpi-value red">-$${expenseSum.toFixed(2)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Flujo Neto</div>
      <div class="kpi-value purple">${net >= 0 ? '+' : ''}$${net.toFixed(2)}</div>
    </div>
  </div>

  <h3>📊 Distribución por Categoría</h3>
  <table>
    <thead>
      <tr>
        <th>Categoría</th>
        <th>Monto Gastado</th>
        <th>Porcentaje del Total</th>
      </tr>
    </thead>
    <tbody>
      ${dist.categoriesDistribution.map(c => `
        <tr>
          <td>${c.icon} ${c.name}</td>
          <td class="red">-$${c.amount.toFixed(2)}</td>
          <td>${c.percentage}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h3 style="margin-top:30px;">📋 Útimos Movimientos Registrados</h3>
  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Concepto</th>
        <th>Tipo</th>
        <th>Monto</th>
      </tr>
    </thead>
    <tbody>
      ${dist.categoriesDistribution.length === 0 ? '<tr><td colspan="4">Sin transacciones en el período</td></tr>' : ''}
      ${transactions.map(t => `
        <tr>
          <td>${new Date(t.date).toLocaleDateString('es-ES')}</td>
          <td>${t.description || 'Movimiento'}</td>
          <td>${t.type === 'INCOME' ? 'Ingreso' : 'Gasto'}</td>
          <td class="${t.type === 'INCOME' ? 'green' : 'red'}">${t.type === 'INCOME' ? '+' : '-'}$${Number(t.amount).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    HogarIQ Privado con Inteligencia Artificial • Documento Confidencial Familiar
  </div>
</body>
</html>
    `;
  }
}
