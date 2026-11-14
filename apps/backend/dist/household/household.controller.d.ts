import { HouseholdService } from './household.service';
import { CreateChildAccountDto, InviteMemberDto, UpdateParentalControlDto, UpdateRoleDto } from './household.dto';
import { UserPayload } from '../auth/get-user.decorator';
export declare class HouseholdController {
    private readonly householdService;
    constructor(householdService: HouseholdService);
    getMembers(user: UserPayload): Promise<{
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
    inviteMember(user: UserPayload, dto: InviteMemberDto): Promise<{
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
    getInvitations(user: UserPayload): Promise<{
        email: string;
        id: string;
        householdId: string;
        createdAt: Date;
        role: import(".prisma/client").$Enums.Role;
        code: string;
        status: string;
        expiresAt: Date;
    }[]>;
    joinByCode(user: UserPayload, code: string): Promise<{
        message: string;
        householdId: string;
    }>;
    getActivityFeed(user: UserPayload): Promise<{
        id: string;
        userName: string;
        userEmail: string;
        action: string;
        details: string | null;
        timestamp: Date;
    }[]>;
    updateRole(user: UserPayload, memberId: string, dto: UpdateRoleDto): Promise<{
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
    updateCustomTitle(user: UserPayload, memberId: string, body: {
        customTitle: string;
    }): Promise<{
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
    removeMember(user: UserPayload, memberId: string): Promise<{
        message: string;
    }>;
    getSplitSummary(user: UserPayload): Promise<{
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
    settleSplit(user: UserPayload, body?: {
        note?: string;
    }): Promise<{
        success: boolean;
        message: string;
        settledAt: Date;
    }>;
    getParentalControls(user: UserPayload): Promise<{
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
    createChildAccount(user: UserPayload, dto: CreateChildAccountDto): Promise<{
        message: string;
        config: import("./parental-control.helper").ParentalControlConfig;
        account: any;
    }>;
    updateParentalControl(user: UserPayload, childUserId: string, dto: UpdateParentalControlDto): Promise<import("./parental-control.helper").ParentalControlConfig>;
    topUpChildAccount(user: UserPayload, childUserId: string, body: {
        fromAccountId: string;
        amount: number;
        note?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
