import { PrismaService } from '../prisma/prisma.service';
export interface ReceiptLineItem {
    description: string;
    price: number;
    quantity?: number;
}
export interface ScannedReceiptResult {
    merchantName: string;
    date: string;
    totalAmount: number;
    subtotal: number;
    taxAmount: number;
    currency: string;
    categorySuggestion: string | null;
    categoryId: string | null;
    accountSuggestion: string | null;
    accountId: string | null;
    lineItems: ReceiptLineItem[];
    paymentMethod: string | null;
    isSharedSuggestion: boolean;
    rawText: string;
    confidence: number;
}
export declare class OcrService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    parseReceiptText(rawText: string, householdId: string): Promise<ScannedReceiptResult>;
    getSampleReceipts(): {
        id: string;
        title: string;
        sampleImage: string;
        rawText: string;
    }[];
}
