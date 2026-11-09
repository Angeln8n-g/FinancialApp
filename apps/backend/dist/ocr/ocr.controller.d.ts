import { OcrService } from './ocr.service';
import { TransactionsService } from '../transactions/transactions.service';
export declare class OcrController {
    private readonly ocrService;
    private readonly transactionsService;
    constructor(ocrService: OcrService, transactionsService: TransactionsService);
    getSamples(): {
        success: boolean;
        samples: {
            id: string;
            title: string;
            sampleImage: string;
            rawText: string;
        }[];
    };
    parseReceipt(req: any, rawText: string): Promise<{
        success: boolean;
        candidate: import("./ocr.service").ScannedReceiptResult;
    }>;
    confirmReceipt(req: any, dto: {
        accountId: string;
        categoryId?: string;
        amount: number;
        merchantName: string;
        date?: string;
        isShared?: boolean;
        lineItems?: Array<{
            description: string;
            price: number;
        }>;
        notes?: string;
    }): Promise<{
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
            description: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            date: Date;
            isCleared: boolean;
            isEdited: boolean;
            editReason: string | null;
            editedAt: Date | null;
            isVoided: boolean;
            voidReason: string | null;
            voidedAt: Date | null;
            accountId: string;
            destinationAccountId: string | null;
            categoryId: string | null;
            createdById: string | null;
        };
    }>;
}
