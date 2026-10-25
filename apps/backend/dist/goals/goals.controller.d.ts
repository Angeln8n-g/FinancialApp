import { GoalsService } from './goals.service';
import { UserPayload } from '../auth/get-user.decorator';
export declare class GoalsController {
    private readonly goalsService;
    constructor(goalsService: GoalsService);
    findAll(user: UserPayload): Promise<{
        id: string;
        name: string;
        targetAmount: number;
        currentAmount: number;
        remainingAmount: number;
        targetDate: Date | null;
        daysRemaining: number | null;
        percentage: number;
        isCompleted: boolean;
        suggestedMonthly: number;
    }[]>;
    create(user: UserPayload, body: {
        name: string;
        targetAmount: number;
        currentAmount?: number;
        targetDate?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        householdId: string;
        targetAmount: import("@prisma/client/runtime/library").Decimal;
        currentAmount: import("@prisma/client/runtime/library").Decimal;
        targetDate: Date | null;
    }>;
    update(user: UserPayload, id: string, body: {
        name?: string;
        targetAmount?: number;
        targetDate?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        householdId: string;
        targetAmount: import("@prisma/client/runtime/library").Decimal;
        currentAmount: import("@prisma/client/runtime/library").Decimal;
        targetDate: Date | null;
    }>;
    contribute(user: UserPayload, id: string, body: {
        amount: number;
        accountId?: string;
        notes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        householdId: string;
        targetAmount: import("@prisma/client/runtime/library").Decimal;
        currentAmount: import("@prisma/client/runtime/library").Decimal;
        targetDate: Date | null;
    }>;
    delete(user: UserPayload, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
