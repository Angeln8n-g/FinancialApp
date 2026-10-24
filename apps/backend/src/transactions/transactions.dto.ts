import { TransactionType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty({ message: 'El ID de la cuenta es requerido' })
  accountId!: string;

  @IsOptional()
  @IsString()
  destinationAccountId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsEnum(TransactionType, { message: 'El tipo de transacción debe ser INCOME, EXPENSE o TRANSFER' })
  type!: TransactionType;

  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @IsPositive({ message: 'El monto debe ser mayor que cero' })
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  date?: string;
}
