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
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
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
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
        } | null;
        createdBy: {
            email: string;
            fullName: string | null;
            id: string;
            avatarUrl: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        householdId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        categoryId: string | null;
        accountId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        description: string | null;
        date: Date;
        isCleared: boolean;
        isEdited: boolean;
        editReason: string | null;
        editedAt: Date | null;
        isVoided: boolean;
        voidReason: string | null;
        voidedAt: Date | null;
        destinationAccountId: string | null;
        createdById: string | null;
    })[]>;
    getSummary(user: UserPayload, currency?: string): Promise<{
        totalBalance: number;
        monthlyIncome: number;
        monthlyExpense: number;
        baseCurrency: string;
        accountsCount: number;
        safeToSpend: {
            liquidBalance: number;
            pendingCommitments: number;
            safeToSpendMonth: number;
            safeToSpendDaily: number;
            daysRemaining: number;
            daysInMonth: number;
            healthStatus: "HEALTHY" | "MODERATE" | "CRITICAL";
            breakdown: {
                pendingRemindersTotal: number;
                pendingSubscriptionsTotal: number;
                upcomingDebtsTotal: number;
            };
        };
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
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
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
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
        } | null;
        createdBy: {
            email: string;
            fullName: string | null;
            id: string;
            avatarUrl: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        householdId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        categoryId: string | null;
        accountId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        description: string | null;
        date: Date;
        isCleared: boolean;
        isEdited: boolean;
        editReason: string | null;
        editedAt: Date | null;
        isVoided: boolean;
        voidReason: string | null;
        voidedAt: Date | null;
        destinationAccountId: string | null;
        createdById: string | null;
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
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
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
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        householdId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        categoryId: string | null;
        accountId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        description: string | null;
        date: Date;
        isCleared: boolean;
        isEdited: boolean;
        editReason: string | null;
        editedAt: Date | null;
        isVoided: boolean;
        voidReason: string | null;
        voidedAt: Date | null;
        destinationAccountId: string | null;
        createdById: string | null;
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
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
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
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        householdId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        categoryId: string | null;
        accountId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        description: string | null;
        date: Date;
        isCleared: boolean;
        isEdited: boolean;
        editReason: string | null;
        editedAt: Date | null;
        isVoided: boolean;
        voidReason: string | null;
        voidedAt: Date | null;
        destinationAccountId: string | null;
        createdById: string | null;
    }>;
    importBankStatement(user: UserPayload, body: {
        accountId?: string;
        rawContent?: string;
        transactions?: Array<{
            date?: string;
            description: string;
            amount: number;
            type: any;
            categoryId?: string;
            accountId?: string;
        }>;
    }): Promise<{
        success: boolean;
        message: string;
        importedCount: number;
        skippedCount: number;
    }>;
}
