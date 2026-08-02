import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateTransactionDto } from './transactions.dto';
import { TransactionType } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async findAllByHousehold(householdId: string) {
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

  async create(householdId: string, dto: CreateTransactionDto) {
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

      return transaction;
    });

    this.eventsGateway.notifyHouseholdChange(householdId, 'transaction', 'CREATE');
    return createdTx;
  }

  // 📄 3. Importación Masiva de Extractos Bancarios (CSV/PDF/OFX)
  async importBankStatement(householdId: string, rawContent: string) {
    const account = await this.prisma.account.findFirst({
      where: { householdId },
      orderBy: { createdAt: 'asc' },
    });

    if (!account) throw new NotFoundException('No hay una cuenta activa para importar el extracto');

    const lines = rawContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    const imported: any[] = [];

    for (const line of lines) {
      // Formato CSV simple: fecha, descripcion, monto
      const parts = line.split(',');
      if (parts.length >= 2) {
        const desc = parts[1]?.trim() || parts[0]?.trim();
        const amountMatch = (parts[2] || parts[1] || '').match(/(\d+([.,]\d{1,2})?)/);
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 25.0;

        if (amount > 0) {
          const tx = await this.create(householdId, {
            accountId: account.id,
            type: TransactionType.EXPENSE,
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

  async getSummary(householdId: string) {
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
      if (t.isVoided) continue; // 🚫 Ignorar transacciones anuladas del cálculo mensual
      if (t.type === TransactionType.INCOME) {
        monthlyIncome += Number(t.amount);
      } else if (t.type === TransactionType.EXPENSE) {
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
