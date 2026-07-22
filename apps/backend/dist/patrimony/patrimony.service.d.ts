import { PrismaService } from '../prisma/prisma.service';
export declare class PatrimonyService {
    private prisma;
    constructor(prisma: PrismaService);
    getNetWorth(householdId: string): Promise<{
        totalAssets: number;
        totalLiabilities: number;
        netWorth: number;
        assetsList: {
            id: string;
            name: string;
            type: string;
            value: number;
        }[];
        liabilitiesList: {
            id: string;
            name: string;
            value: number;
        }[];
    }>;
    createAsset(householdId: string, data: {
        name: string;
        type: string;
        value: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        householdId: string;
        type: string;
        value: import("@prisma/client/runtime/library").Decimal;
    }>;
    deleteAsset(householdId: string, assetId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
