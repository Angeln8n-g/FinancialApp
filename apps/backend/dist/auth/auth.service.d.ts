import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    private hashPassword;
    private verifyPassword;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string | null;
            avatarUrl: string | null;
        };
        household: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
        } | null;
        availableHouseholds: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            memberCount: number;
        }[];
    }>;
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string | null;
        };
        household: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    }>;
    switchHousehold(userId: string, targetHouseholdId: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string | null;
            avatarUrl: string | null;
        };
        household: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    getMe(userId: string, householdId: string): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string | null;
            avatarUrl: string | null;
        };
        household: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
        } | null;
        availableHouseholds: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            memberCount: number;
        }[];
    }>;
    exportData(userId: string): Promise<{
        exportDate: string;
        format: string;
        legalNotice: string;
        user: {
            email: string;
            fullName: string | null;
            id: string;
            avatarUrl: string | null;
            createdAt: Date;
            memberships: ({
                household: {
                    allowances: {
                        id: string;
                        createdAt: Date;
                        householdId: string;
                        memberId: string;
                        title: string;
                        limitAmount: import("@prisma/client/runtime/library").Decimal;
                        spentAmount: import("@prisma/client/runtime/library").Decimal;
                        period: import(".prisma/client").$Enums.RecurrencePeriod;
                    }[];
                    accounts: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        householdId: string;
                        type: import(".prisma/client").$Enums.AccountType;
                        balance: import("@prisma/client/runtime/library").Decimal;
                        currency: string;
                        payrollAmount: import("@prisma/client/runtime/library").Decimal | null;
                        payrollFrequency: import(".prisma/client").$Enums.PayrollFrequency | null;
                        payrollDay1: number | null;
                        payrollDay2: number | null;
                        payrollAutoDeposit: boolean;
                        lastPayrollDeposit: Date | null;
                    }[];
                    categories: {
                        id: string;
                        createdAt: Date;
                        name: string;
                        householdId: string | null;
                        icon: string;
                        color: string;
                    }[];
                    budgets: {
                        id: string;
                        householdId: string;
                        limitAmount: import("@prisma/client/runtime/library").Decimal;
                        period: import(".prisma/client").$Enums.RecurrencePeriod;
                        categoryId: string;
                        startDate: Date;
                        endDate: Date | null;
                    }[];
                    debts: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        householdId: string;
                        type: import(".prisma/client").$Enums.DebtType;
                        contactName: string;
                        totalAmount: import("@prisma/client/runtime/library").Decimal;
                        remainingAmount: import("@prisma/client/runtime/library").Decimal;
                        dueDate: Date | null;
                        interestRate: import("@prisma/client/runtime/library").Decimal;
                        targetPayoffDate: Date | null;
                        monthlyTargetPayment: import("@prisma/client/runtime/library").Decimal | null;
                        mitigationStrategy: import(".prisma/client").$Enums.MitigationStrategy | null;
                        isPaidOff: boolean;
                        notes: string | null;
                        cutoffDay: number | null;
                        paymentDueDay: number | null;
                        minimumPayment: import("@prisma/client/runtime/library").Decimal | null;
                        alertDaysBefore: number | null;
                        autoAlert: boolean;
                        accountId: string | null;
                    }[];
                    subscriptions: {
                        id: string;
                        createdAt: Date;
                        name: string;
                        householdId: string;
                        period: import(".prisma/client").$Enums.RecurrencePeriod;
                        categoryId: string | null;
                        accountId: string | null;
                        cost: import("@prisma/client/runtime/library").Decimal;
                        nextBillingDate: Date;
                        autoDeduct: boolean;
                        lastDeductAttempt: Date | null;
                        isActive: boolean;
                    }[];
                    reminders: {
                        id: string;
                        createdAt: Date;
                        householdId: string;
                        title: string;
                        dueDate: Date;
                        amount: import("@prisma/client/runtime/library").Decimal;
                        isPaid: boolean;
                        subscriptionId: string | null;
                        debtId: string | null;
                    }[];
                    assets: {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        name: string;
                        householdId: string;
                        type: string;
                        notes: string | null;
                        debtId: string | null;
                        value: import("@prisma/client/runtime/library").Decimal;
                        purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
                        acquisitionDate: Date | null;
                    }[];
                } & {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                };
            } & {
                id: string;
                joinedAt: Date;
                userId: string;
                householdId: string;
                role: import(".prisma/client").$Enums.Role;
                customTitle: string | null;
            })[];
            auditLogs: {
                id: string;
                userId: string;
                householdId: string;
                action: string;
                details: string | null;
                timestamp: Date;
            }[];
            notifications: {
                id: string;
                createdAt: Date;
                userId: string;
                householdId: string;
                title: string;
                type: string;
                body: string;
                isRead: boolean;
                metadata: string | null;
            }[];
        };
    }>;
    deleteAccount(userId: string, passwordConfirm?: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
