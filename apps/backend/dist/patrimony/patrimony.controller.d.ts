import { PatrimonyService } from './patrimony.service';
import { UserPayload } from '../auth/get-user.decorator';
export declare class PatrimonyController {
    private readonly patrimonyService;
    constructor(patrimonyService: PatrimonyService);
    getNetWorth(user: UserPayload): Promise<{
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
    createAsset(user: UserPayload, body: {
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
    deleteAsset(user: UserPayload, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
