import { AccountType, MitigationStrategy, PayrollFrequency } from '@prisma/client';
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
    debtTotalAmount?: number;
    debtRemainingAmount?: number;
    debtInterestRate?: number;
    debtCutoffDay?: number;
    debtPaymentDueDay?: number;
    debtMinimumPayment?: number;
    debtMitigationStrategy?: MitigationStrategy;
    debtTargetPayoffDate?: string;
    debtMonthlyTargetPayment?: number;
    debtAlertDaysBefore?: number;
    debtAutoAlert?: boolean;
    debtNotes?: string;
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
    debtTotalAmount?: number;
    debtRemainingAmount?: number;
    debtInterestRate?: number;
    debtCutoffDay?: number;
    debtPaymentDueDay?: number;
    debtMinimumPayment?: number;
    debtMitigationStrategy?: MitigationStrategy;
    debtTargetPayoffDate?: string;
    debtMonthlyTargetPayment?: number;
    debtAlertDaysBefore?: number;
    debtAutoAlert?: boolean;
    debtNotes?: string;
}
