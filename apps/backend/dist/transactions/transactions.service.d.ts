import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { CurrencyService } from '../currency/currency.service';
import { CreateTransactionDto } from './transactions.dto';
import { TransactionType } from '@prisma/client';
export declare class TransactionsService {
    private prisma;
    private eventsGateway;
    private currencyService?;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway, currencyService?: CurrencyService | undefined);
    private convertAmount;
    findAllByHousehold(householdId: string, userId?: string): Promise<({
        account: {
            id: string;
            householdId: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        category: {
            id: string;
            householdId: string | null;
            name: string;
            createdAt: Date;
            icon: string;
            color: string;
        } | null;
        destinationAccount: {
            id: string;
            householdId: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        createdBy: {
            email: string;
            fullName: string | null;
            id: string;
            avatarUrl: string | null;
        } | null;
    } & {
        id: string;
        householdId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        createdAt: Date;
        updatedAt: Date;
        accountId: string;
        categoryId: string | null;
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
    create(householdId: string, dto: CreateTransactionDto, currentUserId?: string): Promise<{
        account: {
            id: string;
            householdId: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        category: {
            id: string;
            householdId: string | null;
            name: string;
            createdAt: Date;
            icon: string;
            color: string;
        } | null;
        destinationAccount: {
            id: string;
            householdId: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        createdBy: {
            email: string;
            fullName: string | null;
            id: string;
            avatarUrl: string | null;
        } | null;
    } & {
        id: string;
        householdId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        createdAt: Date;
        updatedAt: Date;
        accountId: string;
        categoryId: string | null;
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
    importBankStatement(householdId: string, dto: {
        accountId?: string;
        rawContent?: string;
        transactions?: Array<{
            date?: string;
            description: string;
            amount: number;
            type: TransactionType;
            categoryId?: string;
            accountId?: string;
        }>;
    }, currentUserId?: string): Promise<{
        success: boolean;
        message: string;
        importedCount: number;
        skippedCount: number;
    }>;
    getSummary(householdId: string, requestedCurrency?: string, userId?: string): Promise<{
        totalBalance: number;
        monthlyIncome: number;
        monthlyExpense: number;
        todayExpense: number;
        baseCurrency: string;
        accountsCount: number;
        isChildAccount: boolean;
        parentalControls: import("../household/parental-control.helper").ParentalControlConfig;
        safeToSpend: {
            liquidBalance: number;
            pendingCommitments: number;
            safeToSpendMonth: number;
            safeToSpendDaily: number;
            daysRemaining: number;
            daysInMonth: number;
            healthStatus: string;
            breakdown: {
                pendingRemindersTotal: number;
                pendingSubscriptionsTotal: number;
                upcomingDebtsTotal: number;
            };
        };
    } | {
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
            healthStatus: "CRITICAL" | "HEALTHY" | "MODERATE";
            breakdown: {
                pendingRemindersTotal: number;
                pendingSubscriptionsTotal: number;
                upcomingDebtsTotal: number;
            };
        };
        todayExpense?: undefined;
        isChildAccount?: undefined;
        parentalControls?: undefined;
    }>;
    update(householdId: string, id: string, dto: {
        amount?: number;
        description?: string;
        categoryId?: string;
        accountId?: string;
        editReason: string;
    }): Promise<{
        account: {
            id: string;
            householdId: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        category: {
            id: string;
            householdId: string | null;
            name: string;
            createdAt: Date;
            icon: string;
            color: string;
        } | null;
        destinationAccount: {
            id: string;
            householdId: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        householdId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        createdAt: Date;
        updatedAt: Date;
        accountId: string;
        categoryId: string | null;
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
    voidTransaction(householdId: string, id: string, dto: {
        voidReason: string;
    }): Promise<{
        account: {
            id: string;
            householdId: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        category: {
            id: string;
            householdId: string | null;
            name: string;
            createdAt: Date;
            icon: string;
            color: string;
        } | null;
        destinationAccount: {
            id: string;
            householdId: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        householdId: string;
        type: import(".prisma/client").$Enums.TransactionType;
        createdAt: Date;
        updatedAt: Date;
        accountId: string;
        categoryId: string | null;
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
}
