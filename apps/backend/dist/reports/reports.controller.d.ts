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
    exportCsv(user: UserPayload, res: any): Promise<any>;
}
