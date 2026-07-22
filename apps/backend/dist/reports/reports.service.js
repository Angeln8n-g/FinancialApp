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
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map