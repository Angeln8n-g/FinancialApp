import { PrismaService } from '../prisma/prisma.service';
import { RecurrencePeriod } from '@prisma/client';
export interface ParentalControlConfig {
    childUserId: string;
    memberId: string;
    childEmail: string;
    childName: string;
    parentEmail: string;
    parentUserId: string;
    householdId: string;
    childAccountId: string;
    maxDailySpend: number;
    maxSingleTransaction: number;
    requireApprovalAbove: number;
    isFrozen: boolean;
    allowSavingsGoals: boolean;
    blockedCategories: string[];
    updatedAt: string;
}
export declare class ParentalControlHelper {
    private static configCache;
    private static getKey;
    static saveConfig(prisma: PrismaService, config: ParentalControlConfig, actorUserId?: string): Promise<ParentalControlConfig>;
    static ensureChildSetup(prisma: PrismaService, params: {
        householdId: string;
        childUserId: string;
        childEmail: string;
        childName: string;
        memberId: string;
        parentEmail: string;
        parentUserId: string;
        initialBalance?: number;
        existingAccountId?: string;
        maxDailySpend?: number;
        maxSingleTransaction?: number;
        requireApprovalAbove?: number;
        allowanceAmount?: number;
        allowancePeriod?: RecurrencePeriod;
    }): Promise<{
        config: ParentalControlConfig;
        account: any;
    }>;
    static getHouseholdParentalControls(prisma: PrismaService, householdId: string): Promise<ParentalControlConfig[]>;
    static getChildConfigIfDependent(prisma: PrismaService, householdId: string, userId?: string): Promise<ParentalControlConfig | null>;
}
