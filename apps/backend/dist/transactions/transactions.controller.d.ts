import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './transactions.dto';
import { UserPayload } from '../auth/get-user.decorator';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    findAll(user: UserPayload): Promise<({
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
    getSummary(user: UserPayload): Promise<{
        totalBalance: number;
        monthlyIncome: number;
        monthlyExpense: number;
        accountsCount: number;
    }>;
    create(user: UserPayload, dto: CreateTransactionDto): Promise<{
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
    importBankStatement(user: UserPayload, body: {
        rawContent: string;
    }): Promise<{
        message: string;
        importedCount: number;
    }>;
}
