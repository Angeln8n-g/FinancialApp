import { PrismaService } from '../prisma/prisma.service';
import { RecurrencePeriod } from '@prisma/client';
export interface FamilyMission {
    id: string;
    householdId: string;
    memberId: string;
    memberName: string;
    title: string;
    description?: string;
    rewardAmount: number;
    status: 'PENDING' | 'COMPLETED' | 'APPROVED_AND_PAID';
    createdAt: string;
    completedAt?: string;
    approvedAt?: string;
}
export interface SavingsMatchingRule {
    householdId: string;
    matchPercentage: number;
    maxMonthlyBonus: number;
    active: boolean;
    totalMatchedThisMonth: number;
}
export declare class AllowancesService {
    private prisma;
    private static missionsMap;
    private static matchingRulesMap;
    constructor(prisma: PrismaService);
    findAll(householdId: string): Promise<{
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
    create(householdId: string, data: {
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
    recordExpense(householdId: string, id: string, amount: number): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        memberId: string;
        title: string;
        limitAmount: import("@prisma/client/runtime/library").Decimal;
        spentAmount: import("@prisma/client/runtime/library").Decimal;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
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
        memberId: string;
        title: string;
        limitAmount: import("@prisma/client/runtime/library").Decimal;
        spentAmount: import("@prisma/client/runtime/library").Decimal;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
    }>;
    createRequest(householdId: string, memberId: string, allowanceId: string, amount: number, reason: string): Promise<{
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
    getRequests(householdId: string): Promise<({
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
    respondRequest(householdId: string, requestId: string, status: 'APPROVED' | 'REJECTED'): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        memberId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        status: string;
        reason: string;
        allowanceId: string;
    }>;
    remove(id: string, householdId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getMissions(householdId: string): Promise<FamilyMission[]>;
    createMission(householdId: string, data: {
        memberId: string;
        title: string;
        rewardAmount: number;
        description?: string;
    }): Promise<FamilyMission>;
    completeMission(householdId: string, missionId: string, memberId?: string): Promise<FamilyMission>;
    approveAndPayMission(householdId: string, missionId: string, data: {
        accountId: string;
    }, parentUserId?: string): Promise<{
        mission: FamilyMission;
        message: string;
    }>;
    deleteMission(householdId: string, missionId: string): Promise<boolean>;
    getSavingsMatching(householdId: string): SavingsMatchingRule;
    updateSavingsMatching(householdId: string, data: {
        matchPercentage: number;
        maxMonthlyBonus: number;
        active: boolean;
    }): SavingsMatchingRule;
}
