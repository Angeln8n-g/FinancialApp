import { PrismaService } from '../prisma/prisma.service';
import { InviteMemberDto, UpdateRoleDto } from './household.dto';
export declare class HouseholdService {
    private prisma;
    constructor(prisma: PrismaService);
    getMembers(householdId: string): Promise<{
        id: string;
        userId: string;
        email: string;
        fullName: string | null;
        avatarUrl: string | null;
        role: import(".prisma/client").$Enums.Role;
        joinedAt: Date;
    }[]>;
    inviteMember(currentUserId: string, householdId: string, dto: InviteMemberDto): Promise<{
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
    updateRole(currentUserId: string, householdId: string, memberId: string, dto: UpdateRoleDto): Promise<{
        id: string;
        userId: string;
        householdId: string;
        role: import(".prisma/client").$Enums.Role;
        joinedAt: Date;
    }>;
}
