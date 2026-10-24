import { AccountType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la cuenta es requerido' })
  name!: string;

  @IsEnum(AccountType, { message: 'El tipo de cuenta no es válido' })
  type!: AccountType;

  @IsOptional()
  @IsNumber({}, { message: 'El saldo debe ser un número válido' })
  balance?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @IsOptional()
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
