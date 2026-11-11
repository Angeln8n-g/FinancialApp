import { DebtsService } from './debts.service';
import { UserPayload } from '../auth/get-user.decorator';
import { MitigationStrategy } from '@prisma/client';
export declare class DebtsController {
    private readonly debtsService;
    constructor(debtsService: DebtsService);
    findAll(user: UserPayload): Promise<any>;
    create(user: UserPayload, body: {
        contactName: string;
        totalAmount: number;
        remainingAmount?: number;
        interestRate?: number;
        dueDate?: string;
        targetPayoffDate?: string;
        monthlyTargetPayment?: number;
        mitigationStrategy?: MitigationStrategy;
        notes?: string;
        cutoffDay?: number;
        paymentDueDay?: number;
        minimumPayment?: number;
        alertDaysBefore?: number;
        autoAlert?: boolean;
        accountId?: string;
    }): Promise<any>;
    update(user: UserPayload, id: string, body: {
        contactName?: string;
        totalAmount?: number;
        remainingAmount?: number;
        interestRate?: number;
        dueDate?: string;
        targetPayoffDate?: string;
        monthlyTargetPayment?: number;
        mitigationStrategy?: MitigationStrategy;
        notes?: string;
        isPaidOff?: boolean;
        cutoffDay?: number;
        paymentDueDay?: number;
        minimumPayment?: number;
        alertDaysBefore?: number;
        autoAlert?: boolean;
        accountId?: string;
    }): Promise<any>;
    payDebt(user: UserPayload, id: string, body: {
        amount: number;
        accountId?: string;
        notes?: string;
    }): Promise<any>;
    delete(user: UserPayload, id: string): Promise<{
        message: string;
    }>;
}
