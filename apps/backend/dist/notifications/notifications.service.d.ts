import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
export declare class NotificationsService {
    private prisma;
    private eventsGateway;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    getUserNotifications(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        householdId: string;
        type: string;
        title: string;
        body: string;
        isRead: boolean;
        metadata: string | null;
    }[]>;
    createNotification(data: {
        userId: string;
        householdId: string;
        title: string;
        body: string;
        type?: string;
        metadata?: any;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        householdId: string;
        type: string;
        title: string;
        body: string;
        isRead: boolean;
        metadata: string | null;
    }>;
    markAsRead(id: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    registerPushToken(userId: string, pushToken: string): Promise<{
        email: string;
        id: string;
        fullName: string | null;
        avatarUrl: string | null;
        passwordHash: string | null;
        createdAt: Date;
        updatedAt: Date;
        pushToken: string | null;
    }>;
}
