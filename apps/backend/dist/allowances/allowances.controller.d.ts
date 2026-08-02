import { AllowancesService } from './allowances.service';
import { UserPayload } from '../auth/get-user.decorator';
import { RecurrencePeriod } from '@prisma/client';
export declare class AllowancesController {
    private readonly allowancesService;
    constructor(allowancesService: AllowancesService);
    findAll(user: UserPayload): Promise<{
        limitAmount: number;
        spentAmount: number;
        remainingAmount: number;
        percentageUsed: number;
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
        id: string;
        createdAt: Date;
        householdId: string;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
        title: string;
        memberId: string;
    }[]>;
    create(user: UserPayload, body: {
        memberId: string;
        title: string;
        limitAmount: number;
        period?: RecurrencePeriod;
    }): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
        title: string;
        limitAmount: import("@prisma/client/runtime/library").Decimal;
        memberId: string;
        spentAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    recordExpense(user: UserPayload, id: string, body: {
        amount: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
        title: string;
        limitAmount: import("@prisma/client/runtime/library").Decimal;
        memberId: string;
        spentAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    disburse(user: UserPayload, id: string, body: {
        accountId: string;
        amount?: number;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    reset(user: UserPayload, id: string): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
        title: string;
        limitAmount: import("@prisma/client/runtime/library").Decimal;
        memberId: string;
        spentAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(user: UserPayload, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
