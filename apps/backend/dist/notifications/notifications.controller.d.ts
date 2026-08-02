import { NotificationsService } from './notifications.service';
import { UserPayload } from '../auth/get-user.decorator';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getUserNotifications(user: UserPayload): Promise<{
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
    markAsRead(user: UserPayload, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllAsRead(user: UserPayload): Promise<import(".prisma/client").Prisma.BatchPayload>;
    registerPushToken(user: UserPayload, body: {
        pushToken: string;
    }): Promise<{
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
