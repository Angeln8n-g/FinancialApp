import { RecurrencePeriod, Role } from '@prisma/client';
export declare class InviteMemberDto {
    email: string;
    role?: Role;
    parentEmail?: string;
}
export declare class UpdateRoleDto {
    role: Role;
}
export declare class CreateChildAccountDto {
    childName?: string;
    childFullName?: string;
    childEmail: string;
    childPassword?: string;
    parentEmail: string;
    initialBalance?: number;
    maxDailySpend?: number;
    maxSingleTransaction?: number;
    requireApprovalAbove?: number;
    allowanceAmount?: number;
    allowancePeriod?: RecurrencePeriod;
}
export declare class UpdateParentalControlDto {
    parentEmail?: string;
    maxDailySpend?: number;
    maxSingleTransaction?: number;
    requireApprovalAbove?: number;
    isFrozen?: boolean;
    allowSavingsGoals?: boolean;
    blockedCategories?: string[];
}
