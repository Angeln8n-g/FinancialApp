import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
export interface GoalDepositRecord {
    id: string;
    goalId: string;
    childUserId?: string;
    actorUserId: string;
    actorName: string;
    depositSource: 'CHILD_BALANCE' | 'PARENT_DIRECT' | 'ADULT_CONTRIBUTION';
    amount: number;
    note?: string;
    createdAt: string;
}
export declare class GoalsService {
    private prisma;
    private eventsGateway?;
    constructor(prisma: PrismaService, eventsGateway?: EventsGateway | undefined);
    private loadGoalMetadata;
    private enrichGoal;
    findAll(householdId: string, userId?: string, childUserIdFilter?: string): Promise<{
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
        recentDeposits: GoalDepositRecord[];
    }[]>;
    getPiggyBankSummary(householdId: string, userId: string, requestedChildUserId?: string): Promise<{
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
            recentDeposits: GoalDepositRecord[];
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
                recentDeposits: GoalDepositRecord[];
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
    create(householdId: string, data: {
        name: string;
        targetAmount: number;
        currentAmount?: number;
        targetDate?: string;
        emoji?: string;
        childUserId?: string;
    }, userId?: string): Promise<{
        id: string;
        householdId: string;
        name: string;
        createdAt: Date;
        targetAmount: import("@prisma/client/runtime/library").Decimal;
        currentAmount: import("@prisma/client/runtime/library").Decimal;
        targetDate: Date | null;
    }>;
    update(householdId: string, goalId: string, data: {
        name?: string;
        targetAmount?: number;
        targetDate?: string;
    }, userId?: string): Promise<{
        id: string;
        householdId: string;
        name: string;
        createdAt: Date;
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
        householdId: string;
        name: string;
        createdAt: Date;
        targetAmount: import("@prisma/client/runtime/library").Decimal;
        currentAmount: import("@prisma/client/runtime/library").Decimal;
        targetDate: Date | null;
    }>;
    parentDirectDeposit(householdId: string, parentUserId: string, body: {
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
    delete(householdId: string, goalId: string, userId?: string): Promise<import(".prisma/client").Prisma.BatchPayload | {
        count: number;
        refundedAmount: number;
    }>;
}
