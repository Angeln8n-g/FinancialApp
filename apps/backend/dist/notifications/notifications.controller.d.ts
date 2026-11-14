import { NotificationsService } from './notifications.service';
import { UserPayload } from '../auth/get-user.decorator';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getUserNotifications(user: UserPayload): Promise<{
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
    markAsRead(user: UserPayload, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllAsRead(user: UserPayload): Promise<import(".prisma/client").Prisma.BatchPayload>;
    registerPushToken(user: UserPayload, body: {
        pushToken: string;
    }): Promise<{
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
