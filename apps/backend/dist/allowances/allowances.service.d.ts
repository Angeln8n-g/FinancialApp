import { PrismaService } from '../prisma/prisma.service';
import { RecurrencePeriod } from '@prisma/client';
export declare class AllowancesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(householdId: string): Promise<{
        limitAmount: number;
        spentAmount: number;
        remainingAmount: number;
        percentageUsed: number;
        member: {
            user: {
                email: string;
                id: string;
                fullName: string | null;
                avatarUrl: string | null;
                passwordHash: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            userId: string;
            householdId: string;
            role: import(".prisma/client").$Enums.Role;
            joinedAt: Date;
        };
        id: string;
        createdAt: Date;
        householdId: string;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
        title: string;
        memberId: string;
    }[]>;
    create(householdId: string, data: {
        memberId: string;
        title: string;
        limitAmount: number;
        period?: RecurrencePeriod;
    }): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
        title: string;
        limitAmount: import("@prisma/client/runtime/library").Decimal;
        memberId: string;
        spentAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    recordExpense(householdId: string, id: string, amount: number): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
        title: string;
        limitAmount: import("@prisma/client/runtime/library").Decimal;
        memberId: string;
        spentAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    disburse(householdId: string, id: string, data: {
        accountId: string;
        amount?: number;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    reset(householdId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
        title: string;
        limitAmount: import("@prisma/client/runtime/library").Decimal;
        memberId: string;
        spentAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(id: string, householdId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
