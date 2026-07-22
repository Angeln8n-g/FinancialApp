import { DebtsService } from './debts.service';
import { UserPayload } from '../auth/get-user.decorator';
export declare class DebtsController {
    private readonly debtsService;
    constructor(debtsService: DebtsService);
    findAll(user: UserPayload): Promise<{
        id: string;
        contactName: string;
        type: import(".prisma/client").$Enums.DebtType;
        totalAmount: number;
        remainingAmount: number;
        interestRate: number;
        dueDate: Date | null;
    }[]>;
    create(user: UserPayload, body: {
        contactName: string;
        totalAmount: number;
        remainingAmount: number;
        interestRate?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        type: import(".prisma/client").$Enums.DebtType;
        dueDate: Date | null;
        contactName: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        remainingAmount: import("@prisma/client/runtime/library").Decimal;
        interestRate: import("@prisma/client/runtime/library").Decimal;
    }>;
    delete(user: UserPayload, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
