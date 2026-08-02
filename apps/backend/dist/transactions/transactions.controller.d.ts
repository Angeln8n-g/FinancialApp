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
        createdBy: {
            email: string;
            id: string;
            fullName: string | null;
            avatarUrl: string | null;
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
        createdById: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
        isCleared: boolean;
        ocrProcessed: boolean;
        ocrTextRaw: string | null;
        isEdited: boolean;
        editReason: string | null;
        editedAt: Date | null;
        isVoided: boolean;
        voidReason: string | null;
        voidedAt: Date | null;
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
        createdBy: {
            email: string;
            id: string;
            fullName: string | null;
            avatarUrl: string | null;
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
        createdById: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
        isCleared: boolean;
        ocrProcessed: boolean;
        ocrTextRaw: string | null;
        isEdited: boolean;
        editReason: string | null;
        editedAt: Date | null;
        isVoided: boolean;
        voidReason: string | null;
        voidedAt: Date | null;
    }>;
    update(user: UserPayload, id: string, body: {
        amount?: number;
        description?: string;
        categoryId?: string;
        accountId?: string;
        editReason: string;
    }): Promise<{
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
        createdById: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
        isCleared: boolean;
        ocrProcessed: boolean;
        ocrTextRaw: string | null;
        isEdited: boolean;
        editReason: string | null;
        editedAt: Date | null;
        isVoided: boolean;
        voidReason: string | null;
        voidedAt: Date | null;
    }>;
    voidTransaction(user: UserPayload, id: string, body: {
        voidReason: string;
    }): Promise<{
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
        createdById: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
        isCleared: boolean;
        ocrProcessed: boolean;
        ocrTextRaw: string | null;
        isEdited: boolean;
        editReason: string | null;
        editedAt: Date | null;
        isVoided: boolean;
        voidReason: string | null;
        voidedAt: Date | null;
    }>;
    importBankStatement(user: UserPayload, body: {
        rawContent: string;
    }): Promise<{
        message: string;
        importedCount: number;
    }>;
}
