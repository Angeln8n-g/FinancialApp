import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async createNotification(data: {
    userId: string;
    householdId: string;
    title: string;
    body: string;
    type?: string;
    metadata?: any;
  }) {
    const notif = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        householdId: data.householdId,
        title: data.title,
        body: data.body,
        type: data.type || 'GENERAL',
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    // Notificar por WebSockets en tiempo real
    this.eventsGateway.notifyHouseholdChange(data.householdId, 'notification', 'CREATE');
    return notif;
  }

  async create(
    dataOrHouseholdId: any,
    title?: string,
    body?: string,
  ) {
    if (typeof dataOrHouseholdId === 'string') {
      const member = await this.prisma.householdMember.findFirst({
        where: { householdId: dataOrHouseholdId },
        select: { userId: true },
      });
      if (!member) return null;
      return this.createNotification({
        userId: member.userId,
        householdId: dataOrHouseholdId,
        title: title || 'Notificación',
        body: body || '',
      });
    }
    return this.createNotification(dataOrHouseholdId);
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async registerPushToken(userId: string, pushToken: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pushToken },
    });
  }
}
