import { Role } from '@prisma/client';
export declare class InviteMemberDto {
    email: string;
    role?: Role;
}
export declare class UpdateRoleDto {
    role: Role;
}
