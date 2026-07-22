import { RemindersService } from './reminders.service';
import { UserPayload } from '../auth/get-user.decorator';
export declare class RemindersController {
    private readonly remindersService;
    constructor(remindersService: RemindersService);
    findAll(user: UserPayload): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        title: string;
        dueDate: Date;
        isPaid: boolean;
    }[]>;
    create(user: UserPayload, body: {
        title: string;
        amount: number;
        dueDate: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        title: string;
        dueDate: Date;
        isPaid: boolean;
    }>;
    togglePaid(user: UserPayload, id: string): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        title: string;
        dueDate: Date;
        isPaid: boolean;
    } | {
        isPaid: boolean;
        message: string;
    }>;
    delete(user: UserPayload, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
