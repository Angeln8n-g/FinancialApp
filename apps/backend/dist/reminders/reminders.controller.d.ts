import { RemindersService } from './reminders.service';
import { UserPayload } from '../auth/get-user.decorator';
export declare class RemindersController {
    private readonly remindersService;
    constructor(remindersService: RemindersService);
    findAll(user: UserPayload): Promise<({
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
    create(user: UserPayload, body: {
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
    togglePaid(user: UserPayload, id: string, body?: {
        accountId?: string;
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
    } | {
        isPaid: boolean;
        message: string;
    }>;
    delete(user: UserPayload, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
