import { PrismaService } from '../prisma/prisma.service';
export declare class SubscriptionsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(householdId: string): Promise<{
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
    create(householdId: string, data: {
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
    update(householdId: string, subId: string, data: {
        name?: string;
        cost?: number;
    }): Promise<import(".prisma/client").Prisma.BatchPayload>;
    delete(householdId: string, subId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
