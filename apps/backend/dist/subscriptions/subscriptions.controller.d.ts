import { SubscriptionsService } from './subscriptions.service';
import { UserPayload } from '../auth/get-user.decorator';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    findAll(user: UserPayload): Promise<{
        totalMonthlyConsumption: number;
        totalAnnualConsumption: number;
        subscriptions: {
            id: string;
            name: string;
            cost: number;
            period: import(".prisma/client").$Enums.RecurrencePeriod;
            nextBillingDate: Date;
        }[];
    }>;
    create(user: UserPayload, body: {
        name: string;
        cost: number;
        nextBillingDate?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        householdId: string;
        cost: import("@prisma/client/runtime/library").Decimal;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
        nextBillingDate: Date;
        isActive: boolean;
    }>;
    update(user: UserPayload, id: string, body: {
        name?: string;
        cost?: number;
    }): Promise<import(".prisma/client").Prisma.BatchPayload>;
    delete(user: UserPayload, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
