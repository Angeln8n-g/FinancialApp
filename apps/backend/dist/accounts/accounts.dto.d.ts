import { AccountType, PayrollFrequency } from '@prisma/client';
export declare class CreateAccountDto {
    name: string;
    type: AccountType;
    balance?: number;
    currency?: string;
    payrollAmount?: number;
    payrollFrequency?: PayrollFrequency;
    payrollDay1?: number;
    payrollDay2?: number;
    payrollAutoDeposit?: boolean;
}
export declare class UpdateAccountDto {
    name?: string;
    type?: AccountType;
    balance?: number;
    currency?: string;
    payrollAmount?: number;
    payrollFrequency?: PayrollFrequency;
    payrollDay1?: number;
    payrollDay2?: number;
    payrollAutoDeposit?: boolean;
}
