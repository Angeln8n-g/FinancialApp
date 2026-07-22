import { BudgetsService } from './budgets.service';
import { UserPayload } from '../auth/get-user.decorator';
export declare class BudgetsController {
    private readonly budgetsService;
    constructor(budgetsService: BudgetsService);
    getProgress(user: UserPayload): Promise<any[]>;
    create(user: UserPayload, body: {
        categoryId: string;
        limitAmount: number;
    }): Promise<{
        id: string;
        householdId: string;
        categoryId: string;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
        limitAmount: import("@prisma/client/runtime/library").Decimal;
        startDate: Date;
        endDate: Date | null;
    }>;
    update(user: UserPayload, id: string, body: {
        limitAmount: number;
    }): Promise<import(".prisma/client").Prisma.BatchPayload>;
    delete(user: UserPayload, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
