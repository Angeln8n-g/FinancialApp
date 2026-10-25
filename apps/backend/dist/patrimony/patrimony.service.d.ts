import { PrismaService } from '../prisma/prisma.service';
export declare class CreateAssetDto {
    name: string;
    type: string;
    value: number;
    purchasePrice?: number;
    acquisitionDate?: string | Date;
    notes?: string;
    debtId?: string;
}
export declare class UpdateAssetDto {
    name?: string;
    type?: string;
    purchasePrice?: number;
    acquisitionDate?: string | Date;
    notes?: string;
    debtId?: string | null;
}
export declare class UpdateValuationDto {
    value: number;
    notes?: string;
    valuationDate?: string | Date;
}
export declare class PatrimonyService {
    private prisma;
    constructor(prisma: PrismaService);
    getNetWorth(householdId: string): Promise<{
        totalAssets: number;
        liquidAssets: number;
        fixedAssets: number;
        totalLiabilities: number;
        netWorth: number;
        liquidNetWorth: number;
        solvencyRatio: number;
        debtToAssetRatio: number;
        totalAppreciation: number;
        assetAllocation: {
            type: string;
            amount: number;
            percentage: number;
        }[];
        assetsList: {
            id: string;
            name: string;
            type: string;
            value: number;
            purchasePrice: number | null;
            acquisitionDate: Date | null;
            notes: string | null;
            debtId: string | null;
            appreciationAmount: number | null;
            appreciationPercentage: number | null;
            linkedDebt: {
                id: string;
                contactName: string;
                remainingAmount: number;
                totalAmount: number;
                interestRate: number;
            } | null;
            netEquity: number;
            latestValuations: {
                id: string;
                value: number;
                notes: string | null;
                valuationDate: Date;
            }[];
            createdAt: Date;
            updatedAt: Date;
        }[];
        accountsList: {
            id: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: number;
        }[];
        liabilitiesList: {
            id: string;
            name: string;
            value: number;
            totalAmount: number;
            interestRate: number;
            targetPayoffDate: Date | null;
            isPaidOff: boolean;
            hasLinkedAsset: boolean;
        }[];
    }>;
    createAsset(householdId: string, data: CreateAssetDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        householdId: string;
        type: string;
        debtId: string | null;
        notes: string | null;
        value: import("@prisma/client/runtime/library").Decimal;
        purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
        acquisitionDate: Date | null;
    }>;
    updateAsset(householdId: string, assetId: string, data: UpdateAssetDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        householdId: string;
        type: string;
        debtId: string | null;
        notes: string | null;
        value: import("@prisma/client/runtime/library").Decimal;
        purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
        acquisitionDate: Date | null;
    }>;
    updateAssetValuation(householdId: string, assetId: string, data: UpdateValuationDto): Promise<{
        asset: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            householdId: string;
            type: string;
            debtId: string | null;
            notes: string | null;
            value: import("@prisma/client/runtime/library").Decimal;
            purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
            acquisitionDate: Date | null;
        };
        valuation: {
            id: string;
            createdAt: Date;
            notes: string | null;
            value: import("@prisma/client/runtime/library").Decimal;
            valuationDate: Date;
            assetId: string;
        };
    }>;
    deleteAsset(householdId: string, assetId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        householdId: string;
        type: string;
        debtId: string | null;
        notes: string | null;
        value: import("@prisma/client/runtime/library").Decimal;
        purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
        acquisitionDate: Date | null;
    }>;
    getAssetValuations(householdId: string, assetId: string): Promise<{
        id: string;
        createdAt: Date;
        notes: string | null;
        value: import("@prisma/client/runtime/library").Decimal;
        valuationDate: Date;
        assetId: string;
    }[]>;
}
