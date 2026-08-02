import { HouseholdService } from './household.service';
import { InviteMemberDto, UpdateRoleDto } from './household.dto';
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
        joinedAt: Date;
    }[]>;
    inviteMember(user: UserPayload, dto: InviteMemberDto): Promise<{
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
        invitationCode: string;
        inviteLink: string;
    }>;
    getInvitations(user: UserPayload): Promise<{
        email: string;
        id: string;
        createdAt: Date;
        householdId: string;
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
    }>;
}
