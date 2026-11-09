import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { CurrencyService } from '../currency/currency.service';
import { CreateTransactionDto } from './transactions.dto';
import { TransactionType } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private currencyService: CurrencyService,
  ) {}

  async findAllByHousehold(householdId: string) {
    return this.prisma.transaction.findMany({
      where: { householdId },
      include: {
        account: true,
        destinationAccount: true,
        category: true,
        createdBy: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { date: 'desc' },
      take: 50,
    });
  }

  async create(householdId: string, dto: CreateTransactionDto, currentUserId?: string) {
    const { accountId, destinationAccountId, categoryId, type, amount, description, date } = dto;

    if (amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor que cero');
    }

    const sourceAccount = await this.prisma.account.findFirst({
      where: { id: accountId, householdId },
    });

    if (!sourceAccount) {
      throw new NotFoundException('Cuenta de origen no encontrada');
    }

    if (type === TransactionType.TRANSFER) {
      if (!destinationAccountId) {
        throw new BadRequestException('Se requiere cuenta de destino para transferencias');
      }

      const destAccount = await this.prisma.account.findFirst({
        where: { id: destinationAccountId, householdId },
      });

      if (!destAccount) {
        throw new NotFoundException('Cuenta de destino no encontrada');
      }
    }

    const txDate = date ? new Date(date) : new Date();

    const createdTx = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          householdId,
          accountId,
          destinationAccountId: type === TransactionType.TRANSFER ? destinationAccountId : null,
          categoryId: categoryId || null,
          createdById: currentUserId || null,
          type,
          amount,
          description: description || null,
          date: txDate,
        },
        include: {
          account: true,
          destinationAccount: true,
          category: true,
          createdBy: {
            select: { id: true, fullName: true, email: true, avatarUrl: true },
          },
        },
      });

      if (type === TransactionType.EXPENSE) {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { decrement: amount } },
        });
      } else if (type === TransactionType.INCOME) {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: amount } },
        });
      } else if (type === TransactionType.TRANSFER && destinationAccountId) {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { decrement: amount } },
        });
        await tx.account.update({
          where: { id: destinationAccountId },
          data: { balance: { increment: amount } },
        });
      }

      if (currentUserId) {
        await tx.auditLog.create({
          data: {
            userId: currentUserId,
            householdId,
            action: 'CREATE_TRANSACTION',
            details: `Registró un ${type === 'EXPENSE' ? 'gasto' : type === 'INCOME' ? 'ingreso' : 'traslado'} de $${amount} (${description || 'Sin descripción'})`,
          },
        });
      }

      return transaction;
    });

    this.eventsGateway.notifyHouseholdChange(householdId, 'transaction', 'CREATE');
    return createdTx;
  }

  // 📄 3. Importación Masiva de Extractos Bancarios (CSV/Excel/OFX con Detección de Duplicados)
  async importBankStatement(
    householdId: string,
    dto: {
      accountId?: string;
      rawContent?: string;
      transactions?: Array<{
        date?: string;
        description: string;
        amount: number;
        type: TransactionType;
        categoryId?: string;
        accountId?: string;
      }>;
    },
    currentUserId?: string,
  ) {
    let targetAccount: any = null;
    if (dto.accountId) {
      targetAccount = await this.prisma.account.findFirst({
        where: { id: dto.accountId, householdId },
      });
    }
    if (!targetAccount) {
      targetAccount = await this.prisma.account.findFirst({
        where: { householdId },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!targetAccount) {
      throw new NotFoundException('No hay una cuenta activa para importar el extracto');
    }

    // A. Si viene la lista de transacciones previsualizadas y confirmadas desde el modal
    if (dto.transactions && Array.isArray(dto.transactions)) {
      const imported: any[] = [];
      let skippedCount = 0;

      for (const item of dto.transactions) {
        const itemAmount = Number(item.amount);
        if (isNaN(itemAmount) || itemAmount <= 0) continue;

        const txDate = item.date ? new Date(item.date) : new Date();
        const startOfDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
        const endOfDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate(), 23, 59, 59, 999);
        const itemAccountId = item.accountId || targetAccount.id;

        // 🛡️ Detección de duplicados: misma cuenta, mismo día, mismo monto y descripción idéntica
        const duplicate = await this.prisma.transaction.findFirst({
          where: {
            householdId,
            accountId: itemAccountId,
            amount: itemAmount,
            type: item.type,
            date: { gte: startOfDay, lte: endOfDay },
            description: item.description,
            isVoided: false,
          },
        });

        if (duplicate) {
          skippedCount++;
          continue;
        }

        const created = await this.create(
          householdId,
          {
            accountId: itemAccountId,
            type: item.type,
            amount: itemAmount,
            description: item.description,
            categoryId: item.categoryId,
            date: txDate.toISOString(),
          },
          currentUserId,
        );
        imported.push(created);
      }

      return {
        success: true,
        message: `Se importaron ${imported.length} transacciones correctamente${
          skippedCount > 0 ? ` (${skippedCount} omitidas por duplicadas)` : ''
        }`,
        importedCount: imported.length,
        skippedCount,
      };
    }

    // B. Fallback para texto plano CSV en crudo si se envía rawContent
    if (dto.rawContent) {
      const lines = dto.rawContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
      const imported: any[] = [];

      for (const line of lines) {
        const parts = line.split(/[;,]/);
        if (parts.length >= 2) {
          const desc = parts[1]?.trim() || parts[0]?.trim();
          const amountMatch = (parts[2] || parts[1] || '').match(/(\d+([.,]\d{1,2})?)/);
          const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 25.0;

          if (amount > 0) {
            const isNegative = (parts[2] || parts[1] || '').includes('-');
            const type = isNegative ? TransactionType.EXPENSE : TransactionType.INCOME;

            const tx = await this.create(
              householdId,
              {
                accountId: targetAccount.id,
                type,
                amount,
                description: `[Importado] ${desc}`,
              },
              currentUserId,
            );
            imported.push(tx);
          }
        }
      }

      return {
        success: true,
        message: `Se importaron ${imported.length} transacciones en crudo con éxito`,
        importedCount: imported.length,
        skippedCount: 0,
      };
    }

    throw new BadRequestException('Se requieren transacciones estructuradas o rawContent');
  }

  async getSummary(householdId: string, requestedCurrency?: string) {
    const accounts = await this.prisma.account.findMany({
      where: { householdId },
    });

    const baseCurrency = (requestedCurrency || accounts[0]?.currency || 'USD').toUpperCase();
    await this.currencyService.refreshRates();

    // 💡 Consolidación de balance total convirtiendo cada cuenta a la moneda base
    const totalBalance = accounts.reduce((acc, account) => {
      const converted = this.currencyService.convert(
        Number(account.balance),
        account.currency || 'USD',
        baseCurrency,
      );
      return acc + converted;
    }, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const daysInMonth = endOfMonth.getDate();
    const currentDay = now.getDate();
    const daysRemaining = Math.max(1, daysInMonth - currentDay + 1);

    const monthlyTransactions = await this.prisma.transaction.findMany({
      where: {
        householdId,
        date: { gte: startOfMonth },
      },
      include: {
        account: true,
      },
    });

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    for (const t of monthlyTransactions) {
      if (t.isVoided) continue; // 🚫 Ignorar transacciones anuladas del cálculo mensual
      const txCurrency = t.account?.currency || baseCurrency;
      const amountConverted = this.currencyService.convert(
        Number(t.amount),
        txCurrency,
        baseCurrency,
      );
      if (t.type === TransactionType.INCOME) {
        monthlyIncome += amountConverted;
      } else if (t.type === TransactionType.EXPENSE) {
        monthlyExpense += amountConverted;
      }
    }

    // 💡 CÁLCULO DE SAFE-TO-SPEND (Disponible Real Diario Libre de Culpa)
    // 1. Saldo Líquido Disponible consolidado a moneda base
    const liquidBalance = accounts
      .filter((a) => ['CASH', 'BANK_ACCOUNT', 'PAYROLL', 'SAVINGS'].includes(a.type))
      .reduce((acc, a) => {
        const bal = Math.max(0, Number(a.balance));
        return acc + this.currencyService.convert(bal, a.currency || 'USD', baseCurrency);
      }, 0);

    // 2. Recordatorios de pago impagos del mes
    const pendingReminders = await this.prisma.reminder.findMany({
      where: {
        householdId,
        isPaid: false,
        dueDate: { lte: endOfMonth },
      },
    });
    const pendingRemindersTotal = pendingReminders.reduce((acc, r) => acc + Number(r.amount), 0);

    // 3. Suscripciones activas pendientes para este mes
    const reminderSubIds = new Set(
      pendingReminders.filter((r) => r.subscriptionId).map((r) => r.subscriptionId),
    );
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: {
        householdId,
        isActive: true,
        nextBillingDate: { lte: endOfMonth },
      },
      include: {
        account: true,
      },
    });
    const pendingSubscriptionsTotal = activeSubscriptions
      .filter((s) => !reminderSubIds.has(s.id))
      .reduce((acc, s) => {
        const costConverted = this.currencyService.convert(
          Number(s.cost),
          s.account?.currency || 'USD',
          baseCurrency,
        );
        return acc + costConverted;
      }, 0);

    // 4. Deudas por pagar con cuota o pago mínimo de este mes
    const reminderDebtIds = new Set(
      pendingReminders.filter((r) => r.debtId).map((r) => r.debtId),
    );
    const activeDebts = await this.prisma.debt.findMany({
      where: {
        householdId,
        isPaidOff: false,
        type: 'OWED_BY_ME',
      },
    });
    const upcomingDebtsTotal = activeDebts
      .filter((d) => !reminderDebtIds.has(d.id))
      .reduce((acc, d) => {
        const payment = Number(d.minimumPayment || d.monthlyTargetPayment || 0);
        return acc + payment;
      }, 0);

    const pendingCommitments = pendingRemindersTotal + pendingSubscriptionsTotal + upcomingDebtsTotal;
    const safeToSpendMonth = Math.max(0, liquidBalance - pendingCommitments);
    const safeToSpendDaily = Math.round((safeToSpendMonth / daysRemaining) * 100) / 100;

    let healthStatus: 'HEALTHY' | 'MODERATE' | 'CRITICAL' = 'HEALTHY';
    if (safeToSpendMonth === 0 || liquidBalance < pendingCommitments) {
      healthStatus = 'CRITICAL';
    } else if (safeToSpendDaily < 15) {
      healthStatus = 'MODERATE';
    }

    return {
      totalBalance: Math.round(totalBalance * 100) / 100,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      monthlyExpense: Math.round(monthlyExpense * 100) / 100,
      baseCurrency,
      accountsCount: accounts.length,
      safeToSpend: {
        liquidBalance: Math.round(liquidBalance * 100) / 100,
        pendingCommitments: Math.round(pendingCommitments * 100) / 100,
        safeToSpendMonth: Math.round(safeToSpendMonth * 100) / 100,
        safeToSpendDaily,
        daysRemaining,
        daysInMonth,
        healthStatus,
        breakdown: {
          pendingRemindersTotal: Math.round(pendingRemindersTotal * 100) / 100,
          pendingSubscriptionsTotal: Math.round(pendingSubscriptionsTotal * 100) / 100,
          upcomingDebtsTotal: Math.round(upcomingDebtsTotal * 100) / 100,
        },
      },
    };
  }

  async update(
    householdId: string,
    id: string,
    dto: {
      amount?: number;
      description?: string;
      categoryId?: string;
      accountId?: string;
      editReason: string;
    },
  ) {
    if (!dto.editReason || !dto.editReason.trim()) {
      throw new BadRequestException('Se requiere una razón/comentario obligatorio para editar la transacción');
    }

    const existing = await this.prisma.transaction.findFirst({
      where: { id, householdId },
    });
    if (!existing) throw new NotFoundException('Transacción no encontrada');

    if (existing.isVoided) {
      throw new BadRequestException('No se puede editar una transacción anulada');
    }

    const oldAmount = Number(existing.amount);
    const newAmount = dto.amount !== undefined ? dto.amount : oldAmount;
    const oldAccountId = existing.accountId;
    const newAccountId = dto.accountId || oldAccountId;

    const updatedTx = await this.prisma.$transaction(async (tx) => {
      // 1. Ajustar saldos de las cuentas por la diferencia o por cambio de cuenta
      if (existing.type === TransactionType.EXPENSE) {
        if (oldAccountId === newAccountId) {
          const diff = newAmount - oldAmount;
          if (diff !== 0) {
            await tx.account.update({
              where: { id: oldAccountId },
              data: { balance: { decrement: diff } },
            });
          }
        } else {
          await tx.account.update({
            where: { id: oldAccountId },
            data: { balance: { increment: oldAmount } },
          });
          await tx.account.update({
            where: { id: newAccountId },
            data: { balance: { decrement: newAmount } },
          });
        }
      } else if (existing.type === TransactionType.INCOME) {
        if (oldAccountId === newAccountId) {
          const diff = newAmount - oldAmount;
          if (diff !== 0) {
            await tx.account.update({
              where: { id: oldAccountId },
              data: { balance: { increment: diff } },
            });
          }
        } else {
          await tx.account.update({
            where: { id: oldAccountId },
            data: { balance: { decrement: oldAmount } },
          });
          await tx.account.update({
            where: { id: newAccountId },
            data: { balance: { increment: newAmount } },
          });
        }
      }

      // 2. Marcar transacción como editada con la razón
      return tx.transaction.update({
        where: { id },
        data: {
          ...(dto.amount !== undefined && { amount: newAmount }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId || null }),
          ...(dto.accountId && { accountId: newAccountId }),
          isEdited: true,
          editReason: dto.editReason.trim(),
          editedAt: new Date(),
        },
        include: {
          account: true,
          destinationAccount: true,
          category: true,
        },
      });
    });

    this.eventsGateway.notifyHouseholdChange(householdId, 'transaction', 'UPDATE');
    return updatedTx;
  }

  async voidTransaction(householdId: string, id: string, dto: { voidReason: string }) {
    if (!dto.voidReason || !dto.voidReason.trim()) {
      throw new BadRequestException('Se requiere un motivo obligatorio para anular el movimiento');
    }

    const existing = await this.prisma.transaction.findFirst({
      where: { id, householdId },
    });
    if (!existing) throw new NotFoundException('Transacción no encontrada');

    if (existing.isVoided) {
      throw new BadRequestException('La transacción ya se encuentra anulada');
    }

    const amount = Number(existing.amount);

    const voidedTx = await this.prisma.$transaction(async (tx) => {
      // Revertir el impacto financiero
      if (existing.type === TransactionType.EXPENSE) {
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: { increment: amount } },
        });
      } else if (existing.type === TransactionType.INCOME) {
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: { decrement: amount } },
        });
      } else if (existing.type === TransactionType.TRANSFER && existing.destinationAccountId) {
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: { increment: amount } },
        });
        await tx.account.update({
          where: { id: existing.destinationAccountId },
          data: { balance: { decrement: amount } },
        });
      }

      return tx.transaction.update({
        where: { id },
        data: {
          isVoided: true,
          voidReason: dto.voidReason.trim(),
          voidedAt: new Date(),
        },
        include: {
          account: true,
          destinationAccount: true,
          category: true,
        },
      });
    });

    this.eventsGateway.notifyHouseholdChange(householdId, 'transaction', 'VOID');
    return voidedTx;
  }
}
