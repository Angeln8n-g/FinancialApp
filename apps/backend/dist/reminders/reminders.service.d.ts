import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
export declare class RemindersService {
    private prisma;
    private eventsGateway;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    findAll(householdId: string): Promise<({
        debt: {
            id: string;
            createdAt: Date;
            householdId: string;
            type: import(".prisma/client").$Enums.DebtType;
            dueDate: Date | null;
            contactName: string;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            remainingAmount: import("@prisma/client/runtime/library").Decimal;
            interestRate: import("@prisma/client/runtime/library").Decimal;
        } | null;
        subscription: {
            id: string;
            createdAt: Date;
            name: string;
            householdId: string;
            cost: import("@prisma/client/runtime/library").Decimal;
            period: import(".prisma/client").$Enums.RecurrencePeriod;
            nextBillingDate: Date;
            isActive: boolean;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        householdId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        title: string;
        dueDate: Date;
        isPaid: boolean;
        subscriptionId: string | null;
        debtId: string | null;
    })[]>;
    create(householdId: string, data: {
        title: string;
        amount: number;
        dueDate: string;
        subscriptionId?: string;
        debtId?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        title: string;
        dueDate: Date;
        isPaid: boolean;
        subscriptionId: string | null;
        debtId: string | null;
    }>;
    togglePaid(householdId: string, reminderId: string, accountId?: string): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        title: string;
        dueDate: Date;
        isPaid: boolean;
        subscriptionId: string | null;
        debtId: string | null;
    } | {
        isPaid: boolean;
        message: string;
    }>;
    delete(householdId: string, reminderId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
