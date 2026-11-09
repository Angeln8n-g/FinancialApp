import { ReportsService } from './reports.service';
import { UserPayload } from '../auth/get-user.decorator';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getExpenseDistribution(user: UserPayload): Promise<{
        totalExpense: number;
        categoriesDistribution: {
            percentage: number;
            name: string;
            icon: string;
            color: string;
            amount: number;
        }[];
    }>;
    getCashflowProjection(user: UserPayload, days?: string): Promise<{
        startingBalance: number;
        endingBalance: number;
        minProjectedBalance: number;
        minBalanceDate: string;
        hasDeficit: boolean;
        totalProjectedIncome: number;
        totalProjectedFixedExpenses: number;
        horizonDays: number;
        trajectory: {
            dayIndex: number;
            date: string;
            formattedDate: string;
            projectedBalance: number;
            incomes: number;
            fixedExpenses: number;
            estimatedVariable: number;
            events: string[];
        }[];
    }>;
    exportCsv(user: UserPayload, res: any): Promise<any>;
    getPdfReport(user: UserPayload, res: any): Promise<any>;
}
