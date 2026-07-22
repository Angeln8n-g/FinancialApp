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
    updateRole(user: UserPayload, memberId: string, dto: UpdateRoleDto): Promise<{
        id: string;
        userId: string;
        householdId: string;
        role: import(".prisma/client").$Enums.Role;
        joinedAt: Date;
    }>;
}
