import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
export declare class NotificationsService {
    private prisma;
    private eventsGateway;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    getUserNotifications(userId: string, householdId?: string, unreadOnly?: boolean): Promise<{
        id: string;
        userId: string;
        householdId: string;
        type: string;
        createdAt: Date;
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
        userId: string;
        householdId: string;
        type: string;
        createdAt: Date;
        title: string;
        body: string;
        isRead: boolean;
        metadata: string | null;
    }>;
    create(dataOrHouseholdId: any, title?: string, body?: string): Promise<{
        id: string;
        userId: string;
        householdId: string;
        type: string;
        createdAt: Date;
        title: string;
        body: string;
        isRead: boolean;
        metadata: string | null;
    } | null>;
    markAsRead(id: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllAsRead(userId: string, householdId?: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    deleteNotification(id: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    clearReadNotifications(userId: string, householdId?: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    clearAllNotifications(userId: string, householdId?: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    registerPushToken(userId: string, pushToken: string): Promise<{
        email: string;
        fullName: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        avatarUrl: string | null;
        passwordHash: string | null;
        pushToken: string | null;
    }>;
}
