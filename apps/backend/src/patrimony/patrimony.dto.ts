import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  value: number;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsNumber()
  @Type(() => Number)
  purchasePrice?: number;

  @IsOptional()
  acquisitionDate?: string | Date;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  notes?: string;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  debtId?: string | null;
}

export class UpdateAssetDto {
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  name?: string;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  type?: string;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsNumber()
  @Type(() => Number)
  purchasePrice?: number;

  @IsOptional()
  acquisitionDate?: string | Date;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  notes?: string;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  debtId?: string | null;
}

export class UpdateValuationDto {
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  value: number;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  notes?: string;

  @IsOptional()
  valuationDate?: string | Date;
}
