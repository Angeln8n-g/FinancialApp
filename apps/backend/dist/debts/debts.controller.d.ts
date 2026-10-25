import { DebtsService } from './debts.service';
import { UserPayload } from '../auth/get-user.decorator';
import { MitigationStrategy } from '@prisma/client';
export declare class DebtsController {
    private readonly debtsService;
    constructor(debtsService: DebtsService);
    findAll(user: UserPayload): Promise<{
        id: string;
        contactName: string;
        type: import(".prisma/client").$Enums.DebtType;
        totalAmount: number;
        remainingAmount: number;
        paidAmount: number;
        progressPercentage: number;
        isPaidOff: boolean;
        interestRate: number;
        dueDate: Date | null;
        targetPayoffDate: Date | null;
        monthlyTargetPayment: number | null;
        mitigationStrategy: import(".prisma/client").$Enums.MitigationStrategy;
        notes: string | null;
        monthsRemaining: number | null;
        daysRemaining: number | null;
        suggestedMonthlyPayment: number;
    }[]>;
    create(user: UserPayload, body: {
        contactName: string;
        totalAmount: number;
        remainingAmount?: number;
        interestRate?: number;
        dueDate?: string;
        targetPayoffDate?: string;
        monthlyTargetPayment?: number;
        mitigationStrategy?: MitigationStrategy;
        notes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        householdId: string;
        type: import(".prisma/client").$Enums.DebtType;
        dueDate: Date | null;
        contactName: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        remainingAmount: import("@prisma/client/runtime/library").Decimal;
        interestRate: import("@prisma/client/runtime/library").Decimal;
        targetPayoffDate: Date | null;
        monthlyTargetPayment: import("@prisma/client/runtime/library").Decimal | null;
        mitigationStrategy: import(".prisma/client").$Enums.MitigationStrategy | null;
        isPaidOff: boolean;
        notes: string | null;
    }>;
    update(user: UserPayload, id: string, body: {
        contactName?: string;
        totalAmount?: number;
        remainingAmount?: number;
        interestRate?: number;
        dueDate?: string;
        targetPayoffDate?: string;
        monthlyTargetPayment?: number;
        mitigationStrategy?: MitigationStrategy;
        notes?: string;
        isPaidOff?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        householdId: string;
        type: import(".prisma/client").$Enums.DebtType;
        dueDate: Date | null;
        contactName: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        remainingAmount: import("@prisma/client/runtime/library").Decimal;
        interestRate: import("@prisma/client/runtime/library").Decimal;
        targetPayoffDate: Date | null;
        monthlyTargetPayment: import("@prisma/client/runtime/library").Decimal | null;
        mitigationStrategy: import(".prisma/client").$Enums.MitigationStrategy | null;
        isPaidOff: boolean;
        notes: string | null;
    }>;
    payDebt(user: UserPayload, id: string, body: {
        amount: number;
        accountId?: string;
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        debt: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            householdId: string;
            type: import(".prisma/client").$Enums.DebtType;
            dueDate: Date | null;
            contactName: string;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            remainingAmount: import("@prisma/client/runtime/library").Decimal;
            interestRate: import("@prisma/client/runtime/library").Decimal;
            targetPayoffDate: Date | null;
            monthlyTargetPayment: import("@prisma/client/runtime/library").Decimal | null;
            mitigationStrategy: import(".prisma/client").$Enums.MitigationStrategy | null;
            isPaidOff: boolean;
            notes: string | null;
        };
        transaction: any;
    }>;
    delete(user: UserPayload, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
