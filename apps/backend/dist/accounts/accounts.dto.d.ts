import { AccountType } from '@prisma/client';
export declare class CreateAccountDto {
    name: string;
    type: AccountType;
    balance?: number;
    currency?: string;
}
export declare class UpdateAccountDto {
    name?: string;
    type?: AccountType;
    balance?: number;
    currency?: string;
}
