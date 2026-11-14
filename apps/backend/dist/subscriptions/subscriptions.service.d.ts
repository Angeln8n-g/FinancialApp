import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';
import { RecurrencePeriod } from '@prisma/client';
export declare class SubscriptionsService {
    private prisma;
    private notificationsService;
    private eventsGateway;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, eventsGateway: EventsGateway);
    calculateNextBillingDate(currentDate: Date, period: RecurrencePeriod): Date;
    deductSubscription(householdId: string, subscriptionId: string, currentUserId?: string, now?: Date): Promise<{
        success: boolean;
        reason: string;
        message: string;
        requiredAmount: number;
        currentBalance: number;
        transaction?: undefined;
        nextBillingDate?: undefined;
        remainingBalance?: undefined;
    } | {
        success: boolean;
        message: string;
        transaction: {
            id: string;
            householdId: string;
            type: import(".prisma/client").$Enums.TransactionType;
            createdAt: Date;
            updatedAt: Date;
            accountId: string;
            categoryId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            description: string | null;
            date: Date;
            isCleared: boolean;
            isEdited: boolean;
            editReason: string | null;
            editedAt: Date | null;
            isVoided: boolean;
            voidReason: string | null;
            voidedAt: Date | null;
            destinationAccountId: string | null;
            createdById: string | null;
        };
        nextBillingDate: Date;
        remainingBalance: number;
        reason?: undefined;
        requiredAmount?: undefined;
        currentBalance?: undefined;
    }>;
    processPendingSubscriptions(householdId?: string): Promise<number>;
    findAll(householdId: string): Promise<{
        totalMonthlyConsumption: number;
        totalAnnualConsumption: number;
        subscriptions: {
            id: string;
            name: string;
            cost: number;
            period: import(".prisma/client").$Enums.RecurrencePeriod;
            nextBillingDate: Date;
            autoDeduct: boolean;
            accountId: string | null;
            account: {
                id: string;
                name: string;
                type: import(".prisma/client").$Enums.AccountType;
                balance: number;
            } | null;
            categoryId: string | null;
            category: {
                id: string;
                name: string;
                icon: string;
                color: string;
            } | null;
        }[];
    }>;
    create(householdId: string, data: {
        name: string;
        cost: number;
        period?: RecurrencePeriod;
        nextBillingDate?: string;
        autoDeduct?: boolean;
        accountId?: string;
        categoryId?: string;
    }): Promise<{
        account: {
            id: string;
            householdId: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        category: {
            id: string;
            householdId: string | null;
            name: string;
            createdAt: Date;
            icon: string;
            color: string;
        } | null;
    } & {
        id: string;
        householdId: string;
        name: string;
        createdAt: Date;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
        accountId: string | null;
        categoryId: string | null;
        cost: import("@prisma/client/runtime/library").Decimal;
        nextBillingDate: Date;
        autoDeduct: boolean;
        lastDeductAttempt: Date | null;
        isActive: boolean;
    }>;
    update(householdId: string, subId: string, data: {
        name?: string;
        cost?: number;
        period?: RecurrencePeriod;
        nextBillingDate?: string;
        autoDeduct?: boolean;
        accountId?: string;
        categoryId?: string | null;
    }): Promise<{
        account: {
            id: string;
            householdId: string;
            name: string;
            type: import(".prisma/client").$Enums.AccountType;
            balance: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
            payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
            payrollDay1: number | null;
            payrollDay2: number | null;
            payrollAutoDeposit: boolean;
            lastPayrollDeposit: Date | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        category: {
            id: string;
            householdId: string | null;
            name: string;
            createdAt: Date;
            icon: string;
            color: string;
        } | null;
    } & {
        id: string;
        householdId: string;
        name: string;
        createdAt: Date;
        period: import(".prisma/client").$Enums.RecurrencePeriod;
        accountId: string | null;
        categoryId: string | null;
        cost: import("@prisma/client/runtime/library").Decimal;
        nextBillingDate: Date;
        autoDeduct: boolean;
        lastDeductAttempt: Date | null;
        isActive: boolean;
    }>;
    delete(householdId: string, subId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
