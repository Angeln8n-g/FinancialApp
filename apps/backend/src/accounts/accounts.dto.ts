import { AccountType, PayrollFrequency } from '@prisma/client';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

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

  // Configuración de Nómina
  @IsOptional()
  @IsNumber({}, { message: 'El monto de nómina debe ser un número válido' })
  @IsPositive({ message: 'El monto de nómina debe ser mayor a cero' })
  payrollAmount?: number;

  @IsOptional()
  @IsEnum(PayrollFrequency, { message: 'La frecuencia debe ser MONTHLY o BIWEEKLY' })
  payrollFrequency?: PayrollFrequency;

  @IsOptional()
  @IsNumber({}, { message: 'El día 1 debe ser entre 1 y 31' })
  @Min(1)
  @Max(31)
  payrollDay1?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El día 2 debe ser entre 1 y 31' })
  @Min(1)
  @Max(31)
  payrollDay2?: number;

  @IsOptional()
  @IsBoolean()
  payrollAutoDeposit?: boolean;
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

  // Configuración de Nómina
  @IsOptional()
  @IsNumber({}, { message: 'El monto de nómina debe ser un número válido' })
  @IsPositive({ message: 'El monto de nómina debe ser mayor a cero' })
  payrollAmount?: number;

  @IsOptional()
  @IsEnum(PayrollFrequency)
  payrollFrequency?: PayrollFrequency;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  payrollDay1?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  payrollDay2?: number;

  @IsOptional()
  @IsBoolean()
  payrollAutoDeposit?: boolean;
}
