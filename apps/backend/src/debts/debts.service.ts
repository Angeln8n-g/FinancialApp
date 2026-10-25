import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';
import { MitigationStrategy, TransactionType } from '@prisma/client';

@Injectable()
export class DebtsService {
  private readonly logger = new Logger(DebtsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private eventsGateway: EventsGateway,
  ) {}

  async findAll(householdId: string) {
    const debts = await this.prisma.debt.findMany({
      where: { householdId },
      orderBy: [{ isPaidOff: 'asc' }, { remainingAmount: 'desc' }],
    });

    const now = new Date();

    return debts.map((d) => {
      const total = Number(d.totalAmount);
      const remaining = Number(d.remainingAmount);
      const paid = Math.max(0, total - remaining);
      const progressPercentage = total > 0 ? Math.round((paid / total) * 100) : 0;
      const isPaidOff = d.isPaidOff || remaining <= 0;

      let monthsRemaining: number | null = null;
      let daysRemaining: number | null = null;
      let suggestedMonthlyPayment = 0;

      if (d.targetPayoffDate) {
        const target = new Date(d.targetPayoffDate);
        const timeDiff = target.getTime() - now.getTime();
        daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

        const monthsDiff =
          (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
        monthsRemaining = Math.max(1, monthsDiff);

        suggestedMonthlyPayment = remaining > 0 ? Math.ceil(remaining / monthsRemaining) : 0;
      }

      return {
        id: d.id,
        contactName: d.contactName,
        type: d.type,
        totalAmount: total,
        remainingAmount: remaining,
        paidAmount: paid,
        progressPercentage,
        isPaidOff,
        interestRate: Number(d.interestRate),
        dueDate: d.dueDate,
        targetPayoffDate: d.targetPayoffDate,
        monthlyTargetPayment: d.monthlyTargetPayment ? Number(d.monthlyTargetPayment) : null,
        mitigationStrategy: d.mitigationStrategy || MitigationStrategy.CUSTOM,
        notes: d.notes,
        monthsRemaining,
        daysRemaining,
        suggestedMonthlyPayment,
      };
    });
  }

  async create(
    householdId: string,
    data: {
      contactName: string;
      totalAmount: number;
      remainingAmount?: number;
      interestRate?: number;
      dueDate?: string;
      targetPayoffDate?: string;
      monthlyTargetPayment?: number;
      mitigationStrategy?: MitigationStrategy;
      notes?: string;
    },
  ) {
    if (data.totalAmount <= 0) {
      throw new BadRequestException('El monto total de la deuda debe ser mayor a cero');
    }

    const remaining = data.remainingAmount !== undefined ? data.remainingAmount : data.totalAmount;

    return this.prisma.debt.create({
      data: {
        householdId,
        contactName: data.contactName.trim(),
        type: 'OWED_BY_ME',
        totalAmount: data.totalAmount,
        remainingAmount: remaining,
        interestRate: data.interestRate || 0,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        targetPayoffDate: data.targetPayoffDate ? new Date(data.targetPayoffDate) : null,
        monthlyTargetPayment: data.monthlyTargetPayment || null,
        mitigationStrategy: data.mitigationStrategy || MitigationStrategy.CUSTOM,
        notes: data.notes?.trim() || null,
        isPaidOff: remaining <= 0,
      },
    });
  }

  async update(
    householdId: string,
    debtId: string,
    data: {
      contactName?: string;
      totalAmount?: number;
      remainingAmount?: number;
      interestRate?: number;
      dueDate?: string;
      targetPayoffDate?: string;
      monthlyTargetPayment?: number;
      mitigationStrategy?: MitigationStrategy;
      notes?: string;
      isPaidOff?: boolean;
    },
  ) {
    const debt = await this.prisma.debt.findFirst({
      where: { id: debtId, householdId },
    });

    if (!debt) {
      throw new NotFoundException('Deuda no encontrada');
    }

    const remaining =
      data.remainingAmount !== undefined ? data.remainingAmount : Number(debt.remainingAmount);

    return this.prisma.debt.update({
      where: { id: debtId },
      data: {
        ...(data.contactName !== undefined && { contactName: data.contactName.trim() }),
        ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
        ...(data.remainingAmount !== undefined && { remainingAmount: data.remainingAmount }),
        ...(data.interestRate !== undefined && { interestRate: data.interestRate }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.targetPayoffDate !== undefined && {
          targetPayoffDate: data.targetPayoffDate ? new Date(data.targetPayoffDate) : null,
        }),
        ...(data.monthlyTargetPayment !== undefined && { monthlyTargetPayment: data.monthlyTargetPayment }),
        ...(data.mitigationStrategy !== undefined && { mitigationStrategy: data.mitigationStrategy }),
        ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
        isPaidOff: data.isPaidOff !== undefined ? data.isPaidOff : remaining <= 0,
      },
    });
  }

  async payDebt(
    householdId: string,
    debtId: string,
    data: { amount: number; accountId?: string; notes?: string },
    currentUserId?: string,
  ) {
    const { amount, accountId, notes } = data;
    if (amount <= 0) {
      throw new BadRequestException('El monto a abonar debe ser mayor a cero.');
    }

    const debt = await this.prisma.debt.findFirst({
      where: { id: debtId, householdId },
    });

    if (!debt) {
      throw new NotFoundException('Deuda no encontrada');
    }

    const currentRemaining = Number(debt.remainingAmount);
    if (currentRemaining <= 0) {
      throw new BadRequestException('Esta deuda ya se encuentra completamente liquidada.');
    }

    const newRemaining = Math.max(0, currentRemaining - amount);
    const isNowPaidOff = newRemaining === 0;

    // Si se especificó una cuenta, verificar saldo disponible
    let accountToDebit: any = null;
    if (accountId) {
      accountToDebit = await this.prisma.account.findFirst({
        where: { id: accountId, householdId },
      });

      if (!accountToDebit) {
        throw new NotFoundException('Cuenta de origen no encontrada');
      }

      if (Number(accountToDebit.balance) < amount) {
        throw new BadRequestException(
          `Saldo insuficiente en "${accountToDebit.name}". Se requieren $${amount.toFixed(2)}, pero solo hay $${Number(accountToDebit.balance).toFixed(2)} disponibles.`,
        );
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let createdTransaction: any = null;

      // 1. Si hay cuenta de origen, crear transacción de gasto y debitar saldo
      if (accountToDebit) {
        let category = await tx.category.findFirst({
          where: {
            householdId,
            name: { in: ['Pago de Deuda', 'Deudas', 'Préstamos', 'Creditos'], mode: 'insensitive' },
          },
        });

        if (!category) {
          category = await tx.category.create({
            data: {
              householdId,
              name: 'Pago de Deuda',
              icon: '💳',
              color: '#F43F5E',
            },
          });
        }

        createdTransaction = await tx.transaction.create({
          data: {
            householdId,
            accountId: accountToDebit.id,
            categoryId: category.id,
            type: TransactionType.EXPENSE,
            amount,
            description: notes || `Abono a deuda: ${debt.contactName}`,
            date: new Date(),
            createdById: currentUserId || null,
          },
        });

        await tx.account.update({
          where: { id: accountToDebit.id },
          data: {
            balance: { decrement: amount },
          },
        });
      }

      // 2. Actualizar monto pendiente de la deuda y estado de liquidación
      const updatedDebt = await tx.debt.update({
        where: { id: debtId },
        data: {
          remainingAmount: newRemaining,
          isPaidOff: isNowPaidOff,
        },
      });

      // 3. Actualizar recordatorios pendientes vinculados si existen
      if (isNowPaidOff) {
        await tx.reminder.updateMany({
          where: { debtId, isPaid: false },
          data: { isPaid: true },
        });
      } else {
        await tx.reminder.updateMany({
          where: { debtId, isPaid: false },
          data: { amount: newRemaining },
        });
      }

      return { updatedDebt, createdTransaction };
    });

    this.logger.log(`Abono a deuda registrado: $${amount} para "${debt.contactName}". Nuevo saldo: $${newRemaining}`);

    // Notificaciones en tiempo real al hogar
    const members = await this.prisma.householdMember.findMany({
      where: { householdId },
      select: { userId: true },
    });

    for (const m of members) {
      await this.notificationsService.createNotification({
        userId: m.userId,
        householdId,
        title: isNowPaidOff ? '🎉 ¡Deuda liquidada con éxito!' : 'Abono a deuda registrado',
        body: isNowPaidOff
          ? `¡Felicitaciones! Se saldó completamente la deuda de "${debt.contactName}" con un abono final de $${amount.toFixed(2)}.`
          : `Se abonaron $${amount.toFixed(2)} a "${debt.contactName}". Saldo pendiente actual: $${newRemaining.toFixed(2)}.`,
        type: 'DEBT_PAYMENT',
        metadata: {
          debtId: debt.id,
          amount,
          newRemaining,
          isPaidOff: isNowPaidOff,
        },
      });
    }

    this.eventsGateway.notifyHouseholdChange(householdId, 'transaction', 'CREATE');
    this.eventsGateway.notifyHouseholdChange(householdId, 'account', 'UPDATE');
    this.eventsGateway.notifyHouseholdChange(householdId, 'debt', 'UPDATE');
    this.eventsGateway.notifyHouseholdChange(householdId, 'notification', 'CREATE');

    return {
      success: true,
      message: isNowPaidOff
        ? `¡Deuda liquidada exitosamente!`
        : `Abono de $${amount.toFixed(2)} registrado. Saldo restante: $${newRemaining.toFixed(2)}.`,
      debt: result.updatedDebt,
      transaction: result.createdTransaction,
    };
  }

  async delete(householdId: string, debtId: string) {
    return this.prisma.debt.deleteMany({
      where: { id: debtId, householdId },
    });
  }
}
