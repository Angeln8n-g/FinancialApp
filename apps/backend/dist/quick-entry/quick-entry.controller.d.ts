import { QuickEntryService } from './quick-entry.service';
export declare class QuickEntryController {
    private readonly quickEntryService;
    constructor(quickEntryService: QuickEntryService);
    parse(req: any, text: string): Promise<{
        success: boolean;
        candidate: import("./quick-entry.service").ParsedTransactionCandidate;
    }>;
    submit(req: any, text: string): Promise<{
        success: boolean;
        transaction: {
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
        };
        candidate: import("./quick-entry.service").ParsedTransactionCandidate;
    }>;
    getTelegramLink(req: any): Promise<{
        success: boolean;
        botUsername: string;
        token: string;
        deepLink: string;
        webhookUrl: string;
        instructions: string;
    }>;
    setupTelegramBot(botToken: string): Promise<{
        success: boolean;
        message: string;
        botUsername?: undefined;
    } | {
        success: boolean;
        botUsername: any;
        message: string;
    }>;
    telegramWebhook(body: any): Promise<{
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
