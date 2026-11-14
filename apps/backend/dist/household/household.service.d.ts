import { PrismaService } from '../prisma/prisma.service';
import { CreateChildAccountDto, InviteMemberDto, UpdateParentalControlDto, UpdateRoleDto } from './household.dto';
export declare class HouseholdService {
    private prisma;
    constructor(prisma: PrismaService);
    private hashPassword;
    getMembers(householdId: string): Promise<{
        id: string;
        userId: string;
        email: string;
        fullName: string | null;
        avatarUrl: string | null;
        role: import(".prisma/client").$Enums.Role;
        customTitle: string | null;
        joinedAt: Date;
        isChildAccount: boolean;
        parentEmail: string | null;
        childAccountId: string | null;
        parentalControls: import("./parental-control.helper").ParentalControlConfig | null;
    }[]>;
    inviteMember(currentUserId: string, householdId: string, dto: InviteMemberDto): Promise<{
        member: {
            user: {
                email: string;
                fullName: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                avatarUrl: string | null;
                passwordHash: string | null;
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
        invitationCode: string;
        inviteLink: string;
    }>;
    getParentalControls(householdId: string, requestingUserId?: string): Promise<{
        account: {
            id: string;
            name: string;
            balance: number;
            currency: string;
        } | null;
        allowance: {
            id: string;
            title: string;
            limitAmount: number;
            spentAmount: number;
            remainingAmount: number;
            period: import(".prisma/client").$Enums.RecurrencePeriod;
        } | null;
        todaySpent: number;
        pendingRequestsCount: number;
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
    }[]>;
    createChildAccount(currentUserId: string, householdId: string, dto: CreateChildAccountDto): Promise<{
        message: string;
        config: import("./parental-control.helper").ParentalControlConfig;
        account: any;
    }>;
    updateParentalControl(currentUserId: string, householdId: string, childUserId: string, dto: UpdateParentalControlDto): Promise<import("./parental-control.helper").ParentalControlConfig>;
    topUpChildAccount(currentUserId: string, householdId: string, childUserId: string, body: {
        fromAccountId: string;
        amount: number;
        note?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getInvitations(householdId: string): Promise<{
        email: string;
        id: string;
        householdId: string;
        createdAt: Date;
        role: import(".prisma/client").$Enums.Role;
        code: string;
        status: string;
        expiresAt: Date;
    }[]>;
    joinByCode(userId: string, code: string): Promise<{
        message: string;
        householdId: string;
    }>;
    getActivityFeed(householdId: string): Promise<{
        id: string;
        userName: string;
        userEmail: string;
        action: string;
        details: string | null;
        timestamp: Date;
    }[]>;
    updateRole(currentUserId: string, householdId: string, memberId: string, dto: UpdateRoleDto): Promise<{
        user: {
            email: string;
            fullName: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            avatarUrl: string | null;
            passwordHash: string | null;
            pushToken: string | null;
        };
    } & {
        id: string;
        userId: string;
        householdId: string;
        role: import(".prisma/client").$Enums.Role;
        customTitle: string | null;
        joinedAt: Date;
    }>;
    updateCustomTitle(currentUserId: string, householdId: string, memberId: string, customTitle: string): Promise<{
        user: {
            email: string;
            fullName: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            avatarUrl: string | null;
            passwordHash: string | null;
            pushToken: string | null;
        };
    } & {
        id: string;
        userId: string;
        householdId: string;
        role: import(".prisma/client").$Enums.Role;
        customTitle: string | null;
        joinedAt: Date;
    }>;
    removeMember(currentUserId: string, householdId: string, memberId: string): Promise<{
        message: string;
    }>;
    getSplitSummary(householdId: string): Promise<{
        totalPool: number;
        fairSharePerMember: number;
        lastSettledAt: Date | null;
        membersSummary: {
            memberId: string;
            userId: string;
            fullName: string;
            email: string;
            customTitle: string | null;
            role: import(".prisma/client").$Enums.Role;
            paidAmount: number;
            fairShare: number;
            netBalance: number;
        }[];
        settlements: {
            fromUserId: string;
            fromName: string;
            toUserId: string;
            toName: string;
            amount: number;
        }[];
        splitTransactions: {
            id: string;
            date: Date;
            amount: number;
            description: string | null;
            payerName: string;
            accountName: string;
            categoryName: string;
            categoryIcon: string;
        }[];
    }>;
    settleSplit(householdId: string, currentUserId: string, note?: string): Promise<{
        success: boolean;
        message: string;
        settledAt: Date;
    }>;
}
