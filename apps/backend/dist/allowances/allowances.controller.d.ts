import { AllowancesService } from './allowances.service';
import { UserPayload } from '../auth/get-user.decorator';
import { RecurrencePeriod } from '@prisma/client';
export declare class AllowancesController {
    private readonly allowancesService;
    constructor(allowancesService: AllowancesService);
    findAll(user: UserPayload): Promise<{
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
            joinedAt: Date;
            userId: string;
            householdId: string;
            role: import(".prisma/client").$Enums.Role;
            customTitle: string | null;
        };
        id: string;
        createdAt: Date;
        householdId: string;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
        title: string;
        memberId: string;
    }[]>;
    create(user: UserPayload, body: {
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
    recordExpense(user: UserPayload, id: string, body: {
        amount: number;
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
    disburse(user: UserPayload, id: string, body: {
        accountId: string;
        amount?: number;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    reset(user: UserPayload, id: string): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
        title: string;
        limitAmount: import("@prisma/client/runtime/library").Decimal;
        memberId: string;
        spentAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    getRequests(user: UserPayload): Promise<({
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
            joinedAt: Date;
            userId: string;
            householdId: string;
            role: import(".prisma/client").$Enums.Role;
            customTitle: string | null;
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
    createRequest(user: UserPayload, allowanceId: string, body: {
        memberId: string;
        amount: number;
        reason: string;
    }): Promise<{
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
            joinedAt: Date;
            userId: string;
            householdId: string;
            role: import(".prisma/client").$Enums.Role;
            customTitle: string | null;
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
    respondRequest(user: UserPayload, requestId: string, body: {
        status: 'APPROVED' | 'REJECTED';
    }): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: string;
        memberId: string;
        reason: string;
        allowanceId: string;
    }>;
    remove(user: UserPayload, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
