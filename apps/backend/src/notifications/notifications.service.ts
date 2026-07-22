import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(householdId: string) {
    // Generar notificaciones dinámicas basadas en el estado del hogar
    const notifications: any[] = [];

    // 1. Alertar sobre recordatorios próximos no pagados
    const pendingReminders = await this.prisma.reminder.findMany({
      where: { householdId, isPaid: false },
      orderBy: { dueDate: 'asc' },
    });

    pendingReminders.forEach((r) => {
      notifications.push({
        id: `rem-${r.id}`,
        title: `⏰ Recordatorio Próximo: ${r.title}`,
        message: `El pago de RD$${Number(r.amount).toLocaleString()} vence el ${new Date(r.dueDate).toLocaleDateString()}.`,
        type: 'WARNING',
        createdAt: r.createdAt,
        isRead: false,
      });
    });

    // 2. Alertar sobre suscripciones activas
    const activeSubs = await this.prisma.subscription.findMany({
      where: { householdId, isActive: true },
    });

    if (activeSubs.length > 0) {
      const totalCost = activeSubs.reduce((sum, s) => sum + Number(s.cost), 0);
      notifications.push({
        id: 'sub-summary',
        title: '📺 Resumen de Suscripciones',
        message: `Tienes ${activeSubs.length} suscripciones activas acumulando $${totalCost.toFixed(2)}/mes.`,
        type: 'INFO',
        createdAt: new Date(),
        isRead: false,
      });
    }

    return notifications;
  }
}
