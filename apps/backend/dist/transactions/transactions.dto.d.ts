import { TransactionType } from '@prisma/client';
export declare class CreateTransactionDto {
    accountId: string;
    destinationAccountId?: string;
    categoryId?: string;
    type: TransactionType;
    amount: number;
    description?: string;
    date?: string;
}
