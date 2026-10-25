import { PatrimonyService } from './patrimony.service';
import { CreateAssetDto, UpdateAssetDto, UpdateValuationDto } from './patrimony.dto';
import { UserPayload } from '../auth/get-user.decorator';
export declare class PatrimonyController {
    private readonly patrimonyService;
    constructor(patrimonyService: PatrimonyService);
    getNetWorth(user: UserPayload): Promise<{
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
    createAsset(user: UserPayload, body: CreateAssetDto): Promise<{
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
    updateAsset(user: UserPayload, id: string, body: UpdateAssetDto): Promise<{
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
    updateAssetValuation(user: UserPayload, id: string, body: UpdateValuationDto): Promise<{
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
    deleteAsset(user: UserPayload, id: string): Promise<{
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
    getAssetValuations(user: UserPayload, id: string): Promise<{
        id: string;
        createdAt: Date;
        notes: string | null;
        value: import("@prisma/client/runtime/library").Decimal;
        valuationDate: Date;
        assetId: string;
    }[]>;
}
