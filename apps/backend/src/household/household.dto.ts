import { RecurrencePeriod, Role } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class InviteMemberDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email!: string;

  @IsOptional()
  @IsEnum(Role, { message: 'El rol debe ser válido' })
  role?: Role;

  @IsOptional()
  @IsEmail({}, { message: 'El correo del padre o tutor debe ser válido' })
  parentEmail?: string;
}

export class UpdateRoleDto {
  @IsEnum(Role, { message: 'El rol debe ser válido' })
  role!: Role;
}

export class CreateChildAccountDto {
  @ValidateIf((o) => !o.childFullName)
  @IsString({ message: 'El nombre del niño debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del niño es requerido' })
  childName?: string;

  @ValidateIf((o) => !o.childName)
  @IsString({ message: 'El nombre del niño debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del niño es requerido' })
  childFullName?: string;

  @IsEmail({}, { message: 'El correo electrónico del niño debe ser válido' })
  @IsNotEmpty({ message: 'El correo del niño es requerido' })
  childEmail!: string;

  @IsOptional()
  @IsString()
  childPassword?: string;

  @IsEmail({}, { message: 'El correo electrónico del padre o tutor debe ser válido' })
  @IsNotEmpty({ message: 'El correo del padre o tutor con control parental es requerido' })
  parentEmail!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  initialBalance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDailySpend?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxSingleTransaction?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  requireApprovalAbove?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  allowanceAmount?: number;

  @IsOptional()
  @IsEnum(RecurrencePeriod)
  allowancePeriod?: RecurrencePeriod;
}

export class UpdateParentalControlDto {
  @IsOptional()
  @IsEmail({}, { message: 'El correo del padre o tutor debe ser válido' })
  parentEmail?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDailySpend?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxSingleTransaction?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  requireApprovalAbove?: number;

  @IsOptional()
  @IsBoolean()
  isFrozen?: boolean;

  @IsOptional()
  @IsBoolean()
  allowSavingsGoals?: boolean;

  @IsOptional()
  @IsArray()
  blockedCategories?: string[];
}
