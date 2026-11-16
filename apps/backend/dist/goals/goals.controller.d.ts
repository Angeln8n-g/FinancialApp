import { GoalsService } from './goals.service';
import { UserPayload } from '../auth/get-user.decorator';
export declare class GoalsController {
    private readonly goalsService;
    constructor(goalsService: GoalsService);
    findAll(user: UserPayload, childUserId?: string): Promise<{
        id: any;
        name: any;
        targetAmount: number;
        currentAmount: number;
        remainingAmount: number;
        targetDate: any;
        daysRemaining: number | null;
        percentage: number;
        isCompleted: boolean;
        suggestedMonthly: number;
        isChildGoal: boolean;
        childUserId: string | null;
        childName: string | null;
        emoji: string;
        childSavedTotal: number;
        parentDepositedTotal: number;
        recentDeposits: import("./goals.service").GoalDepositRecord[];
    }[]>;
    getPiggyBank(user: UserPayload, childUserId?: string): Promise<{
        isChildAccount: boolean;
        childUserId: string;
        childName: string;
        childAccountId: string;
        spendableBalance: number;
        currency: string;
        totalSavedInPiggyBank: number;
        totalTargetAmount: number;
        allowSavingsGoals: boolean;
        isFrozen: boolean;
        goals: {
            id: any;
            name: any;
            targetAmount: number;
            currentAmount: number;
            remainingAmount: number;
            targetDate: any;
            daysRemaining: number | null;
            percentage: number;
            isCompleted: boolean;
            suggestedMonthly: number;
            isChildGoal: boolean;
            childUserId: string | null;
            childName: string | null;
            emoji: string;
            childSavedTotal: number;
            parentDepositedTotal: number;
            recentDeposits: import("./goals.service").GoalDepositRecord[];
        }[];
        recentDeposits: any[];
        childrenPiggyBanks?: undefined;
    } | {
        isChildAccount: boolean;
        childrenPiggyBanks: {
            childUserId: string;
            childName: string;
            childAccountId: string;
            spendableBalance: number;
            totalSavedInPiggyBank: number;
            totalTargetAmount: number;
            goalsCount: number;
            goals: {
                id: any;
                name: any;
                targetAmount: number;
                currentAmount: number;
                remainingAmount: number;
                targetDate: any;
                daysRemaining: number | null;
                percentage: number;
                isCompleted: boolean;
                suggestedMonthly: number;
                isChildGoal: boolean;
                childUserId: string | null;
                childName: string | null;
                emoji: string;
                childSavedTotal: number;
                parentDepositedTotal: number;
                recentDeposits: import("./goals.service").GoalDepositRecord[];
            }[];
        }[];
        childUserId?: undefined;
        childName?: undefined;
        childAccountId?: undefined;
        spendableBalance?: undefined;
        currency?: undefined;
        totalSavedInPiggyBank?: undefined;
        totalTargetAmount?: undefined;
        allowSavingsGoals?: undefined;
        isFrozen?: undefined;
        goals?: undefined;
        recentDeposits?: undefined;
    }>;
    parentDirectDeposit(user: UserPayload, body: {
        childUserId: string;
        fromAccountId: string;
        amount: number;
        goalId?: string;
        newGoalName?: string;
        targetAmount?: number;
        emoji?: string;
        note?: string;
    }): Promise<{
        success: boolean;
        goal: {
            id: string;
            householdId: string;
            name: string;
            createdAt: Date;
            targetAmount: import("@prisma/client/runtime/library").Decimal;
            currentAmount: import("@prisma/client/runtime/library").Decimal;
            targetDate: Date | null;
        };
        message: string;
    }>;
    create(user: UserPayload, body: {
        name: string;
        targetAmount: number;
        currentAmount?: number;
        targetDate?: string;
        emoji?: string;
        childUserId?: string;
    }): Promise<{
        id: string;
        householdId: string;
        name: string;
        createdAt: Date;
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
        householdId: string;
        name: string;
        createdAt: Date;
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
        householdId: string;
        name: string;
        createdAt: Date;
        targetAmount: import("@prisma/client/runtime/library").Decimal;
        currentAmount: import("@prisma/client/runtime/library").Decimal;
        targetDate: Date | null;
    }>;
    parentDepositToGoal(user: UserPayload, id: string, body: {
        childUserId: string;
        fromAccountId: string;
        amount: number;
        note?: string;
    }): Promise<{
        success: boolean;
        goal: {
            id: string;
            householdId: string;
            name: string;
            createdAt: Date;
            targetAmount: import("@prisma/client/runtime/library").Decimal;
            currentAmount: import("@prisma/client/runtime/library").Decimal;
            targetDate: Date | null;
        };
        message: string;
    }>;
    delete(user: UserPayload, id: string): Promise<import(".prisma/client").Prisma.BatchPayload | {
        count: number;
        refundedAmount: number;
    }>;
}
