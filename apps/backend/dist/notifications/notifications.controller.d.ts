import { NotificationsService } from './notifications.service';
import { UserPayload } from '../auth/get-user.decorator';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(user: UserPayload): Promise<any[]>;
}
