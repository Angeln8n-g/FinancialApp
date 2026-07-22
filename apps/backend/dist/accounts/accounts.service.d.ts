import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from './accounts.dto';
export declare class AccountsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAllByHousehold(householdId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        householdId: string;
        type: import(".prisma/client").$Enums.AccountType;
        balance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }[]>;
    findOne(householdId: string, accountId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        householdId: string;
        type: import(".prisma/client").$Enums.AccountType;
        balance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    create(householdId: string, dto: CreateAccountDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        householdId: string;
        type: import(".prisma/client").$Enums.AccountType;
        balance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    update(householdId: string, accountId: string, dto: UpdateAccountDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        householdId: string;
        type: import(".prisma/client").$Enums.AccountType;
        balance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    delete(householdId: string, accountId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        householdId: string;
        type: import(".prisma/client").$Enums.AccountType;
        balance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
}
