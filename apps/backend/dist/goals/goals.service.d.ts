import { PrismaService } from '../prisma/prisma.service';
export declare class GoalsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(householdId: string): Promise<{
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
    create(householdId: string, data: {
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
    update(householdId: string, goalId: string, data: {
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
    contribute(householdId: string, goalId: string, data: {
        amount: number;
        accountId?: string;
        notes?: string;
    }, currentUserId?: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        householdId: string;
        targetAmount: import("@prisma/client/runtime/library").Decimal;
        currentAmount: import("@prisma/client/runtime/library").Decimal;
        targetDate: Date | null;
    }>;
    delete(householdId: string, goalId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
