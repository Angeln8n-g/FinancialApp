import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateTransactionDto } from './transactions.dto';
export declare class TransactionsService {
    private prisma;
    private eventsGateway;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    findAllByHousehold(householdId: string): Promise<({
        account: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            householdId: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
        };
        category: {
            id: string;
            createdAt: Date;
            name: string;
            householdId: string | null;
            icon: string;
            color: string;
        } | null;
        destinationAccount: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            householdId: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        householdId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        description: string | null;
        accountId: string;
        destinationAccountId: string | null;
        categoryId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
        isCleared: boolean;
        ocrProcessed: boolean;
        ocrTextRaw: string | null;
    })[]>;
    create(householdId: string, dto: CreateTransactionDto): Promise<{
        account: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            householdId: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
        };
        category: {
            id: string;
            createdAt: Date;
            name: string;
            householdId: string | null;
            icon: string;
            color: string;
        } | null;
        destinationAccount: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            householdId: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        householdId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        description: string | null;
        accountId: string;
        destinationAccountId: string | null;
        categoryId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
        isCleared: boolean;
        ocrProcessed: boolean;
        ocrTextRaw: string | null;
    }>;
    importBankStatement(householdId: string, rawContent: string): Promise<{
        message: string;
        importedCount: number;
    }>;
    getSummary(householdId: string): Promise<{
        totalBalance: number;
        monthlyIncome: number;
        monthlyExpense: number;
        accountsCount: number;
    }>;
}
