import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  name!: string;
  type!: AccountType;
  balance?: number;
  currency?: string;
}

export class UpdateAccountDto {
  name?: string;
  type?: AccountType;
  balance?: number;
  currency?: string;
}
