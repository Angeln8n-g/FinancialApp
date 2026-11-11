import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';
import { MitigationStrategy, TransactionType } from '@prisma/client';

export interface DebtOperationalDates {
  nextClosingDate: Date | null;
  daysUntilCutoff: number | null;
  nextPaymentDueDate: Date | null;
  daysUntilPaymentDue: number | null;
  isDueSoon: boolean;
  isOverdue: boolean;
  alertBadge: 'NORMAL' | 'DUE_SOON' | 'OVERDUE';
}

@Injectable()
export class DebtsService {
  private readonly logger = new Logger(DebtsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * Calcula dinámicamente las fechas de corte, límites de pago y estados de alerta.
   */
  public calculateOperationalDates(
    d: {
      cutoffDay?: number | null;
      paymentDueDay?: number | null;
      dueDate?: Date | string | null;
      alertDaysBefore?: number | null;
    },
    now = new Date(),
  ): DebtOperationalDates {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    let nextClosingDate: Date | null = null;
    let daysUntilCutoff: number | null = null;

    if (d.cutoffDay && d.cutoffDay >= 1 && d.cutoffDay <= 31) {
      let year = currentYear;
      let month = currentMonth;
      if (currentDay > d.cutoffDay) {
        month += 1;
        if (month > 11) {
          month = 0;
          year += 1;
        }
      }
      const daysInTargetMonth = new Date(year, month + 1, 0).getDate();
      const safeDay = Math.min(d.cutoffDay, daysInTargetMonth);
      nextClosingDate = new Date(year, month, safeDay, 23, 59, 59);
      const diff = nextClosingDate.getTime() - now.getTime();
      daysUntilCutoff = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    let nextPaymentDueDate: Date | null = null;
    let daysUntilPaymentDue: number | null = null;

    if (d.paymentDueDay && d.paymentDueDay >= 1 && d.paymentDueDay <= 31) {
      let year = currentYear;
      let month = currentMonth;
      if (currentDay > d.paymentDueDay) {
        month += 1;
        if (month > 11) {
          month = 0;
          year += 1;
        }
      }
      const daysInTargetMonth = new Date(year, month + 1, 0).getDate();
      const safeDay = Math.min(d.paymentDueDay, daysInTargetMonth);
      nextPaymentDueDate = new Date(year, month, safeDay, 23, 59, 59);
      const diff = nextPaymentDueDate.getTime() - now.getTime();
      daysUntilPaymentDue = Math.ceil(diff / (1000 * 60 * 60 * 24));
    } else if (d.dueDate) {
      nextPaymentDueDate = new Date(d.dueDate);
      const diff = nextPaymentDueDate.getTime() - now.getTime();
      daysUntilPaymentDue = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    const alertDays = d.alertDaysBefore ?? 3;
    const isDueSoon =
      daysUntilPaymentDue !== null && daysUntilPaymentDue >= 0 && daysUntilPaymentDue <= alertDays;
    const isOverdue = daysUntilPaymentDue !== null && daysUntilPaymentDue < 0;

    let alertBadge: 'NORMAL' | 'DUE_SOON' | 'OVERDUE' = 'NORMAL';
    if (isOverdue) alertBadge = 'OVERDUE';
    else if (isDueSoon) alertBadge = 'DUE_SOON';

    return {
      nextClosingDate,
      daysUntilCutoff,
      nextPaymentDueDate,
      daysUntilPaymentDue,
      isDueSoon,
      isOverdue,
      alertBadge,
    };
  }

  /**
   * Sincroniza automáticamente la alerta en la tabla de Recordatorios (Reminder).
   */
  private async syncDebtReminder(householdId: string, debt: any) {
    try {
      const isPaidOff = debt.isPaidOff || Number(debt.remainingAmount) <= 0;

      if (isPaidOff) {
        await (this.prisma as any).reminder.updateMany({
          where: { debtId: debt.id, isPaid: false },
          data: { isPaid: true },
        });
        return;
      }

      if (debt.autoAlert === false) return;

      const dates = this.calculateOperationalDates(debt);
      if (!dates.nextPaymentDueDate) return;

      const amount = debt.minimumPayment
        ? Number(debt.minimumPayment)
        : debt.monthlyTargetPayment
        ? Number(debt.monthlyTargetPayment)
        : Number(debt.remainingAmount);

      const title = `Vencimiento Pago: ${debt.contactName}`;

      const existing = await (this.prisma as any).reminder.findFirst({
        where: { debtId: debt.id, isPaid: false },
      });

      if (existing) {
        await (this.prisma as any).reminder.update({
          where: { id: existing.id },
          data: {
            title,
            amount,
            dueDate: dates.nextPaymentDueDate,
          },
        });
      } else {
        await (this.prisma as any).reminder.create({
          data: {
            householdId,
            debtId: debt.id,
            title,
            amount,
            dueDate: dates.nextPaymentDueDate,
            isPaid: false,
          },
        });
      }
    } catch (e: any) {
      this.logger.warn(`Error sincronizando recordatorio para deuda ${debt.id}: ${e.message}`);
    }
  }

  async findAll(householdId: string) {
    const debts = await (this.prisma as any).debt.findMany({
      where: { householdId },
      include: {
        account: {
          select: { id: true, name: true, type: true, currency: true },
        },
      },
      orderBy: [{ isPaidOff: 'asc' }, { remainingAmount: 'desc' }],
    });

    const now = new Date();

    return debts.map((d: any) => {
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

      const operational = this.calculateOperationalDates(d, now);

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
        // Fechas operativas, cortes y alertas
        cutoffDay: d.cutoffDay || null,
        paymentDueDay: d.paymentDueDay || null,
        minimumPayment: d.minimumPayment ? Number(d.minimumPayment) : null,
        alertDaysBefore: d.alertDaysBefore ?? 3,
        autoAlert: d.autoAlert !== false,
        accountId: d.accountId || null,
        account: d.account || null,
        ...operational,
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
      cutoffDay?: number;
      paymentDueDay?: number;
      minimumPayment?: number;
      alertDaysBefore?: number;
      autoAlert?: boolean;
      accountId?: string;
    },
  ) {
    if (data.totalAmount <= 0) {
      throw new BadRequestException('El monto total de la deuda debe ser mayor a cero');
    }

    const remaining = data.remainingAmount !== undefined ? data.remainingAmount : data.totalAmount;

    const created = await (this.prisma as any).debt.create({
      data: {
        householdId,
        accountId: data.accountId || null,
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
        cutoffDay: data.cutoffDay || null,
        paymentDueDay: data.paymentDueDay || null,
        minimumPayment: data.minimumPayment || null,
        alertDaysBefore: data.alertDaysBefore !== undefined ? data.alertDaysBefore : 3,
        autoAlert: data.autoAlert !== false,
      },
    });

    // Sincronizar alerta automática de pago si aplica
    await this.syncDebtReminder(householdId, created);

    this.eventsGateway.emitHouseholdDataChanged(householdId, {
      type: 'DEBT_CREATED',
      debtId: created.id,
    });

    return created;
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
      cutoffDay?: number;
      paymentDueDay?: number;
      minimumPayment?: number;
      alertDaysBefore?: number;
      autoAlert?: boolean;
    },
  ) {
    const debt = await (this.prisma as any).debt.findFirst({
      where: { id: debtId, householdId },
    });

    if (!debt) {
      throw new NotFoundException('Deuda no encontrada');
    }

    const remaining =
      data.remainingAmount !== undefined ? data.remainingAmount : Number(debt.remainingAmount);

    const updated = await (this.prisma as any).debt.update({
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
        ...(data.cutoffDay !== undefined && { cutoffDay: data.cutoffDay }),
        ...(data.paymentDueDay !== undefined && { paymentDueDay: data.paymentDueDay }),
        ...(data.minimumPayment !== undefined && { minimumPayment: data.minimumPayment }),
        ...(data.alertDaysBefore !== undefined && { alertDaysBefore: data.alertDaysBefore }),
        ...(data.autoAlert !== undefined && { autoAlert: data.autoAlert }),
        isPaidOff: data.isPaidOff !== undefined ? data.isPaidOff : remaining <= 0,
      },
    });

    // Sincronizar alerta automática de pago
    await this.syncDebtReminder(householdId, updated);

    this.eventsGateway.emitHouseholdDataChanged(householdId, {
      type: 'DEBT_UPDATED',
      debtId: updated.id,
    });

    return updated;
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

    const debt = await (this.prisma as any).debt.findFirst({
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

    const result = await (this.prisma as any).$transaction(async (tx: any) => {
      // 1. Descontar saldo de la cuenta de origen si se especificó
      if (accountId) {
        const account = await tx.account.findFirst({
          where: { id: accountId, householdId },
        });

        if (!account) {
          throw new NotFoundException('Cuenta de débito no encontrada.');
        }

        await tx.account.update({
          where: { id: accountId },
          data: { balance: { decrement: amount } },
        });

        // 2. Registrar la transacción contable de pago de deuda
        await tx.transaction.create({
          data: {
            householdId,
            accountId,
            type: TransactionType.EXPENSE,
            amount,
            description: `Abono Deuda: ${debt.contactName}${notes ? ` - ${notes}` : ''}`,
            date: new Date(),
            ...(currentUserId && { createdById: currentUserId }),
          },
        });
      }

      // 3. Actualizar la deuda
      const updatedDebt = await tx.debt.update({
        where: { id: debtId },
        data: {
          remainingAmount: newRemaining,
          isPaidOff: isNowPaidOff,
        },
      });

      // 4. Si la deuda está vinculada a una tarjeta de crédito, sincronizar el balance de la tarjeta
      if (debt.accountId) {
        const cardAccount = await tx.account.findFirst({
          where: { id: debt.accountId, householdId },
        });
        if (cardAccount && cardAccount.type === 'CREDIT_CARD') {
          // El saldo de la tarjeta refleja el saldo deudor (0 o negativo según el abono)
          const newCardBalance = newRemaining > 0 ? -Math.abs(newRemaining) : 0;
          await tx.account.update({
            where: { id: debt.accountId },
            data: { balance: newCardBalance },
          });
        }
      }

      // 5. Si se liquidó la deuda, marcar recordatorios vinculados como pagados
      if (isNowPaidOff) {
        await tx.reminder.updateMany({
          where: { debtId, isPaid: false },
          data: { isPaid: true },
        });
      }

      return updatedDebt;
    });

    // Notificación en el hogar
    await this.notificationsService.create(
      householdId,
      'Abono a Deuda Registrado',
      `Se registró un abono de RD$${amount.toLocaleString()} a "${debt.contactName}". Saldo restante: RD$${newRemaining.toLocaleString()}.`,
    );

    this.eventsGateway.emitHouseholdDataChanged(householdId, {
      type: 'DEBT_PAID',
      debtId,
      amount,
      isPaidOff: isNowPaidOff,
    });

    return result;
  }

  async delete(householdId: string, id: string) {
    const debt = await (this.prisma as any).debt.findFirst({
      where: { id, householdId },
    });

    if (!debt) {
      throw new NotFoundException('Deuda no encontrada');
    }

    // Eliminar recordatorios vinculados
    await (this.prisma as any).reminder.deleteMany({
      where: { debtId: id },
    });

    await (this.prisma as any).debt.delete({ where: { id } });

    this.eventsGateway.emitHouseholdDataChanged(householdId, {
      type: 'DEBT_DELETED',
      debtId: id,
    });

    return { message: 'Deuda eliminada correctamente' };
  }
}
