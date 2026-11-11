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
                fullName: string | null;
                id: string;
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
        memberId: string;
        title: string;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
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
        memberId: string;
        title: string;
        limitAmount: import("@prisma/client/runtime/library").Decimal;
        spentAmount: import("@prisma/client/runtime/library").Decimal;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
    }>;
    recordExpense(user: UserPayload, id: string, body: {
        amount: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        memberId: string;
        title: string;
        limitAmount: import("@prisma/client/runtime/library").Decimal;
        spentAmount: import("@prisma/client/runtime/library").Decimal;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
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
        memberId: string;
        title: string;
        limitAmount: import("@prisma/client/runtime/library").Decimal;
        spentAmount: import("@prisma/client/runtime/library").Decimal;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
    }>;
    getRequests(user: UserPayload): Promise<({
        allowance: {
            id: string;
            createdAt: Date;
            householdId: string;
            memberId: string;
            title: string;
            limitAmount: import("@prisma/client/runtime/library").Decimal;
            spentAmount: import("@prisma/client/runtime/library").Decimal;
            period: import(".prisma/client").$Enums.RecurrencePeriod;
        };
        member: {
            user: {
                email: string;
                fullName: string | null;
                id: string;
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
        memberId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: string;
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
                fullName: string | null;
                id: string;
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
        memberId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: string;
        reason: string;
        allowanceId: string;
    }>;
    respondRequest(user: UserPayload, requestId: string, body: {
        status: 'APPROVED' | 'REJECTED';
    }): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        memberId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: string;
        reason: string;
        allowanceId: string;
    }>;
    remove(user: UserPayload, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getMissions(user: UserPayload): Promise<import("./allowances.service").FamilyMission[]>;
    createMission(user: UserPayload, body: {
        memberId: string;
        title: string;
        rewardAmount: number;
        description?: string;
    }): Promise<import("./allowances.service").FamilyMission>;
    completeMission(user: UserPayload, id: string): Promise<import("./allowances.service").FamilyMission>;
    approveMission(user: UserPayload, id: string, body: {
        accountId: string;
    }): Promise<{
        mission: import("./allowances.service").FamilyMission;
        message: string;
    }>;
    deleteMission(user: UserPayload, id: string): Promise<boolean>;
    getSavingsMatching(user: UserPayload): Promise<import("./allowances.service").SavingsMatchingRule>;
    updateSavingsMatching(user: UserPayload, body: {
        matchPercentage: number;
        maxMonthlyBonus: number;
        active: boolean;
    }): Promise<import("./allowances.service").SavingsMatchingRule>;
}
