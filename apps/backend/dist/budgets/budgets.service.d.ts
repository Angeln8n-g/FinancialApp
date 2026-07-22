import { PrismaService } from '../prisma/prisma.service';
export declare class BudgetsService {
    private prisma;
    constructor(prisma: PrismaService);
    getProgress(householdId: string): Promise<any[]>;
    create(householdId: string, data: {
        categoryId: string;
        limitAmount: number;
    }): Promise<{
        id: string;
        householdId: string;
        categoryId: string;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
        limitAmount: import("@prisma/client/runtime/library").Decimal;
        startDate: Date;
        endDate: Date | null;
    }>;
    update(householdId: string, budgetId: string, data: {
        limitAmount: number;
    }): Promise<import(".prisma/client").Prisma.BatchPayload>;
    delete(householdId: string, budgetId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
