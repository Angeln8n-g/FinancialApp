export declare class CreateAssetDto {
    name: string;
    type: string;
    value: number;
    purchasePrice?: number;
    acquisitionDate?: string | Date;
    notes?: string;
    debtId?: string | null;
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
