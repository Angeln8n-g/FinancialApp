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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getExpenseDistribution(householdId) {
        const expenses = await this.prisma.transaction.findMany({
            where: {
                householdId,
                type: client_1.TransactionType.EXPENSE,
            },
            include: {
                category: true,
            },
        });
        const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
        const map = new Map();
        for (const t of expenses) {
            const catId = t.categoryId || 'uncategorized';
            const catName = t.category?.name || 'Otros';
            const catIcon = t.category?.icon || '📦';
            const catColor = t.category?.color || '#94a3b8';
            const amount = Number(t.amount);
            if (map.has(catId)) {
                const item = map.get(catId);
                item.amount += amount;
            }
            else {
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
    async generateCsv(householdId) {
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
    async generatePdfReport(householdId) {
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
    .print-actions { display: flex; justify-content: flex-end; margin-bottom: 20px; }
    .btn-print { background: #059669; color: #ffffff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px; }
    .btn-print:hover { background: #10b981; }
    .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
    .title { font-size: 26px; font-weight: bold; color: #34d399; margin: 0; }
    .subtitle { color: #94a3b8; font-size: 13px; margin-top: 5px; }
    .kpi-container { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 15px; }
    .kpi-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; flex: 1; text-align: center; }
    .kpi-title { font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; }
    .kpi-value { font-size: 24px; font-weight: bold; margin-top: 8px; }
    .green { color: #34d399; } .red { color: #f43f5e; } .purple { color: #38bdf8; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; background: #1e293b; border-radius: 12px; overflow: hidden; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #334155; font-size: 13px; }
    th { background: #0f172a; color: #34d399; font-size: 11px; text-transform: uppercase; }
    .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #64748b; }
    @media print {
      body { background: #ffffff !important; color: #0f172a !important; padding: 20px !important; }
      .no-print { display: none !important; }
      .header { border-bottom-color: #059669 !important; }
      .title { color: #065f46 !important; }
      .subtitle { color: #64748b !important; }
      .kpi-card { background: #f8fafc !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
      .kpi-title { color: #64748b !important; }
      table { background: #ffffff !important; border: 1px solid #e2e8f0 !important; }
      th { background: #f1f5f9 !important; color: #1e293b !important; border-bottom: 2px solid #cbd5e1 !important; }
      td { border-bottom: 1px solid #e2e8f0 !important; color: #1e293b !important; }
      .green { color: #059669 !important; }
      .red { color: #dc2626 !important; }
      .purple { color: #0284c7 !important; }
    }
  </style>
</head>
<body>
  <div class="print-actions no-print">
    <button onclick="window.print()" class="btn-print">🖨️ Imprimir / Guardar en PDF</button>
  </div>
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
    async getCashflowProjection(householdId, days = 30) {
        const horizonDays = Math.min(60, Math.max(7, Number(days) || 30));
        const accounts = await this.prisma.account.findMany({ where: { householdId } });
        const liquidBalance = accounts
            .filter((a) => ['CASH', 'BANK_ACCOUNT', 'PAYROLL', 'SAVINGS'].includes(a.type))
            .reduce((acc, a) => acc + Math.max(0, Number(a.balance)), 0);
        const payrollAccounts = accounts.filter((a) => a.payrollAutoDeposit && a.payrollAmount && Number(a.payrollAmount) > 0);
        const subscriptions = await this.prisma.subscription.findMany({
            where: { householdId, isActive: true },
        });
        const debts = await this.prisma.debt.findMany({
            where: { householdId, isPaidOff: false, type: 'OWED_BY_ME' },
        });
        const reminders = await this.prisma.reminder.findMany({
            where: { householdId, isPaid: false },
        });
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const pastTransactions = await this.prisma.transaction.findMany({
            where: {
                householdId,
                type: 'EXPENSE',
                isVoided: false,
                date: { gte: thirtyDaysAgo },
            },
        });
        const pastExpenseTotal = pastTransactions.reduce((acc, t) => acc + Number(t.amount), 0);
        const estimatedDailyVariable = Math.round((pastExpenseTotal / 30) * 0.5 * 100) / 100;
        const trajectory = [];
        let currentBalance = liquidBalance;
        let minBalance = currentBalance;
        let minBalanceDate = new Date().toISOString().split('T')[0];
        let totalProjectedIncome = 0;
        let totalProjectedFixedExpenses = 0;
        const startDate = new Date();
        for (let i = 0; i < horizonDays; i++) {
            const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
            const dayOfMonth = d.getDate();
            const dateStr = d.toISOString().split('T')[0];
            const dayEvents = [];
            let dayIncome = 0;
            let dayFixedExpense = 0;
            for (const pa of payrollAccounts) {
                const amount = Number(pa.payrollAmount);
                if (pa.payrollFrequency === 'MONTHLY' && pa.payrollDay1 === dayOfMonth) {
                    dayIncome += amount;
                    dayEvents.push(`Nómina mensual (+${amount.toFixed(0)})`);
                }
                else if (pa.payrollFrequency === 'BIWEEKLY') {
                    if (pa.payrollDay1 === dayOfMonth || pa.payrollDay2 === dayOfMonth) {
                        dayIncome += amount;
                        dayEvents.push(`Nómina quincenal (+${amount.toFixed(0)})`);
                    }
                }
            }
            for (const sub of subscriptions) {
                const subDate = new Date(sub.nextBillingDate);
                if (subDate.getDate() === dayOfMonth) {
                    const cost = Number(sub.cost);
                    dayFixedExpense += cost;
                    dayEvents.push(`${sub.name} (-${cost.toFixed(0)})`);
                }
            }
            for (const debt of debts) {
                if (debt.paymentDueDay === dayOfMonth) {
                    const payment = Number(debt.minimumPayment || debt.monthlyTargetPayment || 0);
                    if (payment > 0) {
                        dayFixedExpense += payment;
                        dayEvents.push(`Pago ${debt.contactName} (-${payment.toFixed(0)})`);
                    }
                }
            }
            for (const rem of reminders) {
                const remDate = new Date(rem.dueDate);
                if (remDate.toISOString().split('T')[0] === dateStr) {
                    const amt = Number(rem.amount);
                    dayFixedExpense += amt;
                    dayEvents.push(`${rem.title} (-${amt.toFixed(0)})`);
                }
            }
            currentBalance = currentBalance + dayIncome - dayFixedExpense - estimatedDailyVariable;
            totalProjectedIncome += dayIncome;
            totalProjectedFixedExpenses += dayFixedExpense;
            if (currentBalance < minBalance) {
                minBalance = currentBalance;
                minBalanceDate = dateStr;
            }
            trajectory.push({
                dayIndex: i,
                date: dateStr,
                formattedDate: d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                projectedBalance: Math.round(currentBalance * 100) / 100,
                incomes: Math.round(dayIncome * 100) / 100,
                fixedExpenses: Math.round(dayFixedExpense * 100) / 100,
                estimatedVariable: estimatedDailyVariable,
                events: dayEvents,
            });
        }
        const hasDeficit = minBalance < 0;
        return {
            startingBalance: Math.round(liquidBalance * 100) / 100,
            endingBalance: Math.round(currentBalance * 100) / 100,
            minProjectedBalance: Math.round(minBalance * 100) / 100,
            minBalanceDate,
            hasDeficit,
            totalProjectedIncome: Math.round(totalProjectedIncome * 100) / 100,
            totalProjectedFixedExpenses: Math.round(totalProjectedFixedExpenses * 100) / 100,
            horizonDays,
            trajectory,
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map