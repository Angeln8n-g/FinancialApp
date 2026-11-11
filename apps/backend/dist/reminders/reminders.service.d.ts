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
            updatedAt: Date;
            householdId: string;
            type: import(".prisma/client").$Enums.DebtType;
            contactName: string;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            remainingAmount: import("@prisma/client/runtime/library").Decimal;
            dueDate: Date | null;
            interestRate: import("@prisma/client/runtime/library").Decimal;
            targetPayoffDate: Date | null;
            monthlyTargetPayment: import("@prisma/client/runtime/library").Decimal | null;
            mitigationStrategy: import(".prisma/client").$Enums.MitigationStrategy | null;
            isPaidOff: boolean;
            notes: string | null;
            cutoffDay: number | null;
            paymentDueDay: number | null;
            minimumPayment: import("@prisma/client/runtime/library").Decimal | null;
            alertDaysBefore: number | null;
            autoAlert: boolean;
            accountId: string | null;
        } | null;
        subscription: {
            id: string;
            createdAt: Date;
            name: string;
            householdId: string;
            period: import(".prisma/client").$Enums.RecurrencePeriod;
            categoryId: string | null;
            accountId: string | null;
            cost: import("@prisma/client/runtime/library").Decimal;
            nextBillingDate: Date;
            autoDeduct: boolean;
            lastDeductAttempt: Date | null;
            isActive: boolean;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        householdId: string;
        title: string;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
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
        title: string;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        subscriptionId: string | null;
        debtId: string | null;
    }>;
    togglePaid(householdId: string, reminderId: string, accountId?: string): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        title: string;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        subscriptionId: string | null;
        debtId: string | null;
    } | {
        isPaid: boolean;
        message: string;
    }>;
    delete(householdId: string, reminderId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
