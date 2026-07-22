import { PrismaService } from '../prisma/prisma.service';
export declare class DebtsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(householdId: string): Promise<{
        id: string;
        contactName: string;
        type: import(".prisma/client").$Enums.DebtType;
        totalAmount: number;
        remainingAmount: number;
        interestRate: number;
        dueDate: Date | null;
    }[]>;
    create(householdId: string, data: {
        contactName: string;
        totalAmount: number;
        remainingAmount: number;
        interestRate?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        type: import(".prisma/client").$Enums.DebtType;
        dueDate: Date | null;
        contactName: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        remainingAmount: import("@prisma/client/runtime/library").Decimal;
        interestRate: import("@prisma/client/runtime/library").Decimal;
    }>;
    delete(householdId: string, debtId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
