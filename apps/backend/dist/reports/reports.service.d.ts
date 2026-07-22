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
}
