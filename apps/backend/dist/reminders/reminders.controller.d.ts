import { RemindersService } from './reminders.service';
import { UserPayload } from '../auth/get-user.decorator';
export declare class RemindersController {
    private readonly remindersService;
    constructor(remindersService: RemindersService);
    findAll(user: UserPayload): Promise<({
        debt: {
            id: string;
            householdId: string;
            type: import(".prisma/client").$Enums.DebtType;
            createdAt: Date;
            updatedAt: Date;
            accountId: string | null;
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
        } | null;
        subscription: {
            id: string;
            householdId: string;
            name: string;
            createdAt: Date;
            period: import(".prisma/client").$Enums.RecurrencePeriod;
            accountId: string | null;
            categoryId: string | null;
            cost: import("@prisma/client/runtime/library").Decimal;
            nextBillingDate: Date;
            autoDeduct: boolean;
            lastDeductAttempt: Date | null;
            isActive: boolean;
        } | null;
    } & {
        id: string;
        householdId: string;
        createdAt: Date;
        title: string;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        subscriptionId: string | null;
        debtId: string | null;
    })[]>;
    create(user: UserPayload, body: {
        title: string;
        amount: number;
        dueDate: string;
        subscriptionId?: string;
        debtId?: string;
    }): Promise<{
        id: string;
        householdId: string;
        createdAt: Date;
        title: string;
        dueDate: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        isPaid: boolean;
        subscriptionId: string | null;
        debtId: string | null;
    }>;
    togglePaid(user: UserPayload, id: string, body?: {
        accountId?: string;
    }): Promise<{
        id: string;
        householdId: string;
        createdAt: Date;
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
    delete(user: UserPayload, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
