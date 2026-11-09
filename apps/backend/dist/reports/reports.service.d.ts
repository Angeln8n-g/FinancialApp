import { PrismaService } from '../prisma/prisma.service';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    getExpenseDistribution(householdId: string): Promise<{
        totalExpense: number;
        categoriesDistribution: {
            percentage: number;
            name: string;
            icon: string;
            color: string;
            amount: number;
        }[];
    }>;
    generateCsv(householdId: string): Promise<string>;
    generatePdfReport(householdId: string): Promise<string>;
    getCashflowProjection(householdId: string, days?: number): Promise<{
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
}
