import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType } from '@prisma/client';
export interface ParsedTransactionCandidate {
    rawInput: string;
    type: TransactionType;
    amount: number;
    description: string;
    accountId: string;
    accountName: string;
    categoryId: string | null;
    categoryName: string | null;
    isShared: boolean;
    confidence: number;
}
export declare class QuickEntryService {
    private prisma;
    private transactionsService;
    private readonly logger;
    private static telegramChatLinks;
    constructor(prisma: PrismaService, transactionsService: TransactionsService);
    parseText(input: string, householdId: string): Promise<ParsedTransactionCandidate>;
    executeQuickEntry(userId: string, householdId: string, input: string): Promise<{
        success: boolean;
        transaction: {
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
        };
        candidate: ParsedTransactionCandidate;
    }>;
    linkTelegramChat(chatId: string, userId: string, householdId: string, userName: string): {
        success: boolean;
        message: string;
    };
    getTelegramLink(chatId: string): {
        userId: string;
        householdId: string;
        userName: string;
    } | undefined;
    handleTelegramWebhook(body: any): Promise<{
        ok: boolean;
        note: string;
        method?: undefined;
        chat_id?: undefined;
        text?: undefined;
        parse_mode?: undefined;
    } | {
        method: string;
        chat_id: any;
        text: string;
        parse_mode: string;
        ok?: undefined;
        note?: undefined;
    }>;
}
