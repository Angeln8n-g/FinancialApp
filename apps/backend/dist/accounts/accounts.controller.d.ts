import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './accounts.dto';
import { UserPayload } from '../auth/get-user.decorator';
export declare class AccountsController {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    findAll(user: UserPayload): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        householdId: string;
        type: import(".prisma/client").$Enums.AccountType;
        balance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }[]>;
    findOne(user: UserPayload, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        householdId: string;
        type: import(".prisma/client").$Enums.AccountType;
        balance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    create(user: UserPayload, dto: CreateAccountDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        householdId: string;
        type: import(".prisma/client").$Enums.AccountType;
        balance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    update(user: UserPayload, id: string, dto: UpdateAccountDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        householdId: string;
        type: import(".prisma/client").$Enums.AccountType;
        balance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    delete(user: UserPayload, id: string): Promise<{
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
