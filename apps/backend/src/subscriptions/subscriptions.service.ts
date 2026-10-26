import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';
import { RecurrencePeriod, TransactionType } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * Calcula la siguiente fecha de cobro según el periodo recurrente.
   */
  calculateNextBillingDate(currentDate: Date, period: RecurrencePeriod): Date {
    const next = new Date(currentDate);
    if (period === RecurrencePeriod.YEARLY) {
      next.setFullYear(next.getFullYear() + 1);
    } else if (period === RecurrencePeriod.WEEKLY) {
      next.setDate(next.getDate() + 7);
    } else {
      // Por defecto MONTHLY
      next.setMonth(next.getMonth() + 1);
    }
    return next;
  }

  /**
   * Ejecuta el intento de cobro/deducción de una suscripción.
   * - Si la cuenta tiene saldo suficiente: debita, crea transacción de gasto, avanza fecha y notifica éxito.
   * - Si NO tiene saldo suficiente: no debita nada, registra el intento y notifica alerta de fondos insuficientes.
   */
  async deductSubscription(
    householdId: string,
    subscriptionId: string,
    currentUserId?: string,
    now: Date = new Date(),
  ) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, householdId },
      include: { account: true, category: true },
    });

    if (!subscription) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    if (!subscription.accountId) {
      throw new BadRequestException('Esta suscripción no tiene una cuenta bancaria asignada para el cobro.');
    }

    const account = await this.prisma.account.findFirst({
      where: { id: subscription.accountId, householdId },
    });

    if (!account) {
      throw new NotFoundException('La cuenta asignada para el cobro no fue encontrada');
    }

    const cost = Number(subscription.cost);
    const balance = Number(account.balance);

    // =========================================================================
    // CASO 1: SALDO INSUFICIENTE (SALVAGUARDA DE FONDOS)
    // =========================================================================
    if (balance < cost) {
      this.logger.warn(
        `Saldo insuficiente para suscripción "${subscription.name}" en cuenta "${account.name}". Requerido: $${cost}, Disponible: $${balance}`,
      );

      // Registrar marca de tiempo del intento fallido para evitar spam continuo
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { lastDeductAttempt: now },
      });

      // Notificar a todos los miembros del hogar sobre los fondos insuficientes
      const members = await this.prisma.householdMember.findMany({
        where: { householdId },
        select: { userId: true },
      });

      for (const m of members) {
        await this.notificationsService.createNotification({
          userId: m.userId,
          householdId,
          title: '⚠️ Fondos insuficientes para suscripción',
          body: `No se pudo cobrar automáticamente "${subscription.name}" ($${cost.toFixed(2)}) de "${account.name}". Saldo disponible: $${balance.toFixed(2)}.`,
          type: 'SUBSCRIPTION_FAILED_FUNDS',
          metadata: {
            subscriptionId: subscription.id,
            accountId: account.id,
            cost,
            balance,
          },
        });
      }

      this.eventsGateway.notifyHouseholdChange(householdId, 'notification', 'CREATE');

      return {
        success: false,
        reason: 'INSUFFICIENT_FUNDS',
        message: `Saldo insuficiente en "${account.name}". Se requieren $${cost.toFixed(2)}, pero solo hay $${balance.toFixed(2)} disponibles.`,
        requiredAmount: cost,
        currentBalance: balance,
      };
    }

    // =========================================================================
    // CASO 2: SALDO SUFICIENTE (DEDUCCIÓN EXITOSA ATÓMICA)
    // =========================================================================
    const nextDate = this.calculateNextBillingDate(subscription.nextBillingDate, subscription.period);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Determinar categoría de la transacción:
      // Si la suscripción tiene categoryId asignado, se usa directamente para impactar su presupuesto.
      // Si no tiene categoría asignada, busca o crea la categoría general 'Servicios'.
      let targetCategoryId = subscription.categoryId;

      if (!targetCategoryId) {
        let category = await tx.category.findFirst({
          where: {
            householdId,
            name: { in: ['Servicios', 'Suscripciones', 'Streaming'], mode: 'insensitive' },
          },
        });

        if (!category) {
          category = await tx.category.create({
            data: {
              householdId,
              name: 'Servicios',
              icon: '📺',
              color: '#3B82F6',
            },
          });
        }
        targetCategoryId = category.id;
      }

      // 2. Crear transacción de gasto vinculada a la categoría correspondiente
      const transaction = await tx.transaction.create({
        data: {
          householdId,
          accountId: account.id,
          categoryId: targetCategoryId,
          type: TransactionType.EXPENSE,
          amount: cost,
          description: `Pago automático suscripción: ${subscription.name}`,
          date: now,
          createdById: currentUserId || null,
        },
      });

      // 3. Descontar del saldo de la cuenta
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: {
          balance: { decrement: cost },
        },
      });

      // 4. Actualizar suscripción avanzando la fecha de próximo cobro
      const updatedSub = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          nextBillingDate: nextDate,
          lastDeductAttempt: now,
        },
      });

      // 5. Marcar como pagados los recordatorios vinculados a esta suscripción
      await tx.reminder.updateMany({
        where: {
          subscriptionId: subscription.id,
          isPaid: false,
          dueDate: { lte: now },
        },
        data: { isPaid: true },
      });

      return { transaction, updatedAccount, updatedSub };
    });

    this.logger.log(
      `Cobro automático exitoso: $${cost} para "${subscription.name}" descontados de "${account.name}". Próximo cobro: ${nextDate.toISOString()}`,
    );

    // Notificar a todos los miembros del hogar sobre el cobro exitoso
    const members = await this.prisma.householdMember.findMany({
      where: { householdId },
      select: { userId: true },
    });

    for (const m of members) {
      await this.notificationsService.createNotification({
        userId: m.userId,
        householdId,
        title: 'Pago automático de suscripción',
        body: `Se debitaron $${cost.toFixed(2)} para "${subscription.name}" de la cuenta "${account.name}". Saldo restante: $${Number(result.updatedAccount.balance).toFixed(2)}.`,
        type: 'SUBSCRIPTION_DEDUCTED',
        metadata: {
          subscriptionId: subscription.id,
          accountId: account.id,
          cost,
          transactionId: result.transaction.id,
          nextBillingDate: nextDate,
        },
      });
    }

    // Emitir eventos en tiempo real al hogar
    this.eventsGateway.notifyHouseholdChange(householdId, 'transaction', 'CREATE');
    this.eventsGateway.notifyHouseholdChange(householdId, 'account', 'UPDATE');
    this.eventsGateway.notifyHouseholdChange(householdId, 'subscription', 'UPDATE');
    this.eventsGateway.notifyHouseholdChange(householdId, 'budget', 'UPDATE');
    this.eventsGateway.notifyHouseholdChange(householdId, 'notification', 'CREATE');

    return {
      success: true,
      message: `Pago de $${cost.toFixed(2)} para "${subscription.name}" realizado con éxito.`,
      transaction: result.transaction,
      nextBillingDate: nextDate,
      remainingBalance: Number(result.updatedAccount.balance),
    };
  }

  /**
   * Procesa suscripciones automáticas pendientes.
   * Evalúa las suscripciones con autoDeduct: true cuya fecha de próximo cobro ha llegado.
   */
  async processPendingSubscriptions(householdId?: string): Promise<number> {
    const now = new Date();
    const where: any = {
      isActive: true,
      autoDeduct: true,
      accountId: { not: null },
      nextBillingDate: { lte: now },
    };

    if (householdId) {
      where.householdId = householdId;
    }

    const pendingSubs = await this.prisma.subscription.findMany({
      where,
      include: { account: true },
    });

    let processedCount = 0;

    for (const sub of pendingSubs) {
      // Evitar reintentar repetidamente el mismo día si ya falló por fondos insuficientes hoy
      if (sub.lastDeductAttempt) {
        const lastAttempt = new Date(sub.lastDeductAttempt);
        const isSameDay =
          lastAttempt.getFullYear() === now.getFullYear() &&
          lastAttempt.getMonth() === now.getMonth() &&
          lastAttempt.getDate() === now.getDate();

        // Si ya se intentó hoy y la cuenta no tiene saldo suficiente, omitir reintentar en este ciclo
        if (isSameDay && sub.account && Number(sub.account.balance) < Number(sub.cost)) {
          continue;
        }
      }

      try {
        const res = await this.deductSubscription(sub.householdId, sub.id, undefined, now);
        if (res.success) {
          processedCount++;
        }
      } catch (err) {
        this.logger.error(`Error procesando cobro automático de suscripción ${sub.id}:`, err);
      }
    }

    return processedCount;
  }

  async findAll(householdId: string) {
    // Catch-up: procesar cobros de suscripciones pendientes antes de devolver los datos
    try {
      await this.processPendingSubscriptions(householdId);
    } catch (err) {
      this.logger.error(`Error en catch-up de suscripciones para household ${householdId}:`, err);
    }

    const subscriptions = await this.prisma.subscription.findMany({
      where: { householdId, isActive: true },
      include: {
        account: {
          select: { id: true, name: true, type: true, balance: true },
        },
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
      },
      orderBy: { cost: 'desc' },
    });

    const items = subscriptions.map((s) => ({
      id: s.id,
      name: s.name,
      cost: Number(s.cost),
      period: s.period,
      nextBillingDate: s.nextBillingDate,
      autoDeduct: s.autoDeduct,
      accountId: s.accountId,
      account: s.account
        ? {
            id: s.account.id,
            name: s.account.name,
            type: s.account.type,
            balance: Number(s.account.balance),
          }
        : null,
      categoryId: s.categoryId,
      category: s.category
        ? {
            id: s.category.id,
            name: s.category.name,
            icon: s.category.icon,
            color: s.category.color,
          }
        : null,
    }));

    const totalMonthlyConsumption = items.reduce((acc, item) => {
      if (item.period === RecurrencePeriod.YEARLY) {
        return acc + item.cost / 12;
      }
      if (item.period === RecurrencePeriod.WEEKLY) {
        return acc + item.cost * 4;
      }
      return acc + item.cost;
    }, 0);

    return {
      totalMonthlyConsumption: Math.round(totalMonthlyConsumption * 100) / 100,
      totalAnnualConsumption: Math.round(totalMonthlyConsumption * 12 * 100) / 100,
      subscriptions: items,
    };
  }

  async create(
    householdId: string,
    data: {
      name: string;
      cost: number;
      period?: RecurrencePeriod;
      nextBillingDate?: string;
      autoDeduct?: boolean;
      accountId?: string;
      categoryId?: string;
    },
  ) {
    if (data.cost <= 0) {
      throw new BadRequestException('El costo de la suscripción debe ser mayor a cero.');
    }

    if (data.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: data.categoryId, householdId },
      });
      if (!category) {
        throw new BadRequestException('La categoría de presupuesto seleccionada no existe o no pertenece a este hogar.');
      }
    }

    return this.prisma.subscription.create({
      data: {
        householdId,
        name: data.name.trim(),
        cost: data.cost,
        period: data.period || RecurrencePeriod.MONTHLY,
        nextBillingDate: data.nextBillingDate
          ? new Date(data.nextBillingDate)
          : new Date(Date.now() + 30 * 86400000),
        autoDeduct: data.autoDeduct ?? false,
        accountId: data.accountId || null,
        categoryId: data.categoryId || null,
      },
      include: { account: true, category: true },
    });
  }

  async update(
    householdId: string,
    subId: string,
    data: {
      name?: string;
      cost?: number;
      period?: RecurrencePeriod;
      nextBillingDate?: string;
      autoDeduct?: boolean;
      accountId?: string;
      categoryId?: string | null;
    },
  ) {
    const existing = await this.prisma.subscription.findFirst({
      where: { id: subId, householdId },
    });

    if (!existing) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    if (data.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: data.categoryId, householdId },
      });
      if (!category) {
        throw new BadRequestException('La categoría de presupuesto seleccionada no existe o no pertenece a este hogar.');
      }
    }

    return this.prisma.subscription.update({
      where: { id: subId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.cost !== undefined && { cost: data.cost }),
        ...(data.period !== undefined && { period: data.period }),
        ...(data.nextBillingDate !== undefined && { nextBillingDate: new Date(data.nextBillingDate) }),
        ...(data.autoDeduct !== undefined && { autoDeduct: data.autoDeduct }),
        ...(data.accountId !== undefined && { accountId: data.accountId || null }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
      },
      include: { account: true, category: true },
    });
  }

  async delete(householdId: string, subId: string) {
    return this.prisma.subscription.deleteMany({
      where: { id: subId, householdId },
    });
  }
}
