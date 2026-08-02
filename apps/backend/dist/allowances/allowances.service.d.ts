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
                pushToken: string | null;
            };
        } & {
            id: string;
            userId: string;
            householdId: string;
            role: import(".prisma/client").$Enums.Role;
            customTitle: string | null;
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
    createRequest(householdId: string, memberId: string, allowanceId: string, amount: number, reason: string): Promise<{
        member: {
            user: {
                email: string;
                id: string;
                fullName: string | null;
                avatarUrl: string | null;
                passwordHash: string | null;
                createdAt: Date;
                updatedAt: Date;
                pushToken: string | null;
            };
        } & {
            id: string;
            userId: string;
            householdId: string;
            role: import(".prisma/client").$Enums.Role;
            customTitle: string | null;
            joinedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        householdId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: string;
        memberId: string;
        reason: string;
        allowanceId: string;
    }>;
    getRequests(householdId: string): Promise<({
        allowance: {
            id: string;
            createdAt: Date;
            householdId: string;
            period: import(".prisma/client").$Enums.RecurrencePeriod;
            title: string;
            limitAmount: import("@prisma/client/runtime/library").Decimal;
            memberId: string;
            spentAmount: import("@prisma/client/runtime/library").Decimal;
        };
        member: {
            user: {
                email: string;
                id: string;
                fullName: string | null;
                avatarUrl: string | null;
                passwordHash: string | null;
                createdAt: Date;
                updatedAt: Date;
                pushToken: string | null;
            };
        } & {
            id: string;
            userId: string;
            householdId: string;
            role: import(".prisma/client").$Enums.Role;
            customTitle: string | null;
            joinedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        householdId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: string;
        memberId: string;
        reason: string;
        allowanceId: string;
    })[]>;
    respondRequest(householdId: string, requestId: string, status: 'APPROVED' | 'REJECTED'): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: string;
        memberId: string;
        reason: string;
        allowanceId: string;
    }>;
    remove(id: string, householdId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
