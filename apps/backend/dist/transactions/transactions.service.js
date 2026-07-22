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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const events_gateway_1 = require("../events/events.gateway");
const client_1 = require("@prisma/client");
let TransactionsService = class TransactionsService {
    prisma;
    eventsGateway;
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
    }
    async findAllByHousehold(householdId) {
        return this.prisma.transaction.findMany({
            where: { householdId },
            include: {
                account: true,
                destinationAccount: true,
                category: true,
            },
            orderBy: { date: 'desc' },
            take: 50,
        });
    }
    async create(householdId, dto) {
        const { accountId, destinationAccountId, categoryId, type, amount, description, date } = dto;
        if (amount <= 0) {
            throw new common_1.BadRequestException('El monto debe ser mayor que cero');
        }
        const sourceAccount = await this.prisma.account.findFirst({
            where: { id: accountId, householdId },
        });
        if (!sourceAccount) {
            throw new common_1.NotFoundException('Cuenta de origen no encontrada');
        }
        if (type === client_1.TransactionType.TRANSFER) {
            if (!destinationAccountId) {
                throw new common_1.BadRequestException('Se requiere cuenta de destino para transferencias');
            }
            const destAccount = await this.prisma.account.findFirst({
                where: { id: destinationAccountId, householdId },
            });
            if (!destAccount) {
                throw new common_1.NotFoundException('Cuenta de destino no encontrada');
            }
        }
        const txDate = date ? new Date(date) : new Date();
        const createdTx = await this.prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    householdId,
                    accountId,
                    destinationAccountId: type === client_1.TransactionType.TRANSFER ? destinationAccountId : null,
                    categoryId: categoryId || null,
                    type,
                    amount,
                    description: description || null,
                    date: txDate,
                },
                include: {
                    account: true,
                    destinationAccount: true,
                    category: true,
                },
            });
            if (type === client_1.TransactionType.EXPENSE) {
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { decrement: amount } },
                });
            }
            else if (type === client_1.TransactionType.INCOME) {
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { increment: amount } },
                });
            }
            else if (type === client_1.TransactionType.TRANSFER && destinationAccountId) {
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { decrement: amount } },
                });
                await tx.account.update({
                    where: { id: destinationAccountId },
                    data: { balance: { increment: amount } },
                });
            }
            return transaction;
        });
        this.eventsGateway.notifyHouseholdChange(householdId, 'transaction', 'CREATE');
        return createdTx;
    }
    async importBankStatement(householdId, rawContent) {
        const account = await this.prisma.account.findFirst({
            where: { householdId },
            orderBy: { createdAt: 'asc' },
        });
        if (!account)
            throw new common_1.NotFoundException('No hay una cuenta activa para importar el extracto');
        const lines = rawContent.split(/\r?\n/).filter(line => line.trim().length > 0);
        const imported = [];
        for (const line of lines) {
            const parts = line.split(',');
            if (parts.length >= 2) {
                const desc = parts[1]?.trim() || parts[0]?.trim();
                const amountMatch = (parts[2] || parts[1] || '').match(/(\d+([.,]\d{1,2})?)/);
                const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 25.0;
                if (amount > 0) {
                    const tx = await this.create(householdId, {
                        accountId: account.id,
                        type: client_1.TransactionType.EXPENSE,
                        amount,
                        description: `[Importado] ${desc}`,
                    });
                    imported.push(tx);
                }
            }
        }
        return {
            message: `Se importaron ${imported.length} transacciones masivamente con éxito`,
            importedCount: imported.length,
        };
    }
    async getSummary(householdId) {
        const accounts = await this.prisma.account.findMany({
            where: { householdId },
        });
        const totalBalance = accounts.reduce((acc, account) => acc + Number(account.balance), 0);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyTransactions = await this.prisma.transaction.findMany({
            where: {
                householdId,
                date: { gte: startOfMonth },
            },
        });
        let monthlyIncome = 0;
        let monthlyExpense = 0;
        for (const t of monthlyTransactions) {
            if (t.type === client_1.TransactionType.INCOME) {
                monthlyIncome += Number(t.amount);
            }
            else if (t.type === client_1.TransactionType.EXPENSE) {
                monthlyExpense += Number(t.amount);
            }
        }
        return {
            totalBalance,
            monthlyIncome,
            monthlyExpense,
            accountsCount: accounts.length,
        };
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map