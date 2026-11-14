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
            isChildAccount: boolean;
            parentEmail: any;
            childAccountId: any;
        };
        household: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            isChildAccount: boolean;
            parentEmail: any;
            childAccountId: any;
            parentalControls: any;
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
            id: any;
            email: any;
            fullName: any;
            isChildAccount: boolean;
            parentEmail: string;
            childAccountId: string;
        };
        household: {
            id: string;
            name: string;
            role: string;
            isChildAccount: boolean;
            parentEmail: string;
            childAccountId: string;
            parentalControls: import("../household/parental-control.helper").ParentalControlConfig;
        };
    } | {
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string | null;
            isChildAccount: boolean;
            parentEmail: string | null;
            childAccountId: string | null;
        };
        household: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            isChildAccount: boolean;
            parentEmail: string | null;
            childAccountId: string | null;
            parentalControls: import("../household/parental-control.helper").ParentalControlConfig | null;
        } | null;
    } | {
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string | null;
            isChildAccount: boolean;
            parentEmail?: undefined;
            childAccountId?: undefined;
        };
        household: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            isChildAccount: boolean;
            parentEmail?: undefined;
            childAccountId?: undefined;
            parentalControls?: undefined;
        };
    }>;
    switchHousehold(userId: string, targetHouseholdId: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            fullName: string | null;
            avatarUrl: string | null;
            isChildAccount: boolean;
            parentEmail: string | null;
            childAccountId: string | null;
        };
        household: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            isChildAccount: boolean;
            parentEmail: string | null;
            childAccountId: string | null;
            parentalControls: import("../household/parental-control.helper").ParentalControlConfig | null;
        };
    }>;
    getMe(userId: string, householdId: string): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string | null;
            avatarUrl: string | null;
            isChildAccount: boolean;
            parentEmail: string | null;
            childAccountId: string | null;
        };
        household: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.Role;
            isChildAccount: boolean;
            parentEmail: string | null;
            childAccountId: string | null;
            parentalControls: import("../household/parental-control.helper").ParentalControlConfig | null;
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
            createdAt: Date;
            avatarUrl: string | null;
            memberships: ({
                household: {
                    subscriptions: {
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
                    }[];
                    debts: {
                        id: string;
                        householdId: string;
                        type: import(".prisma/client").$Enums.DebtType;
                        createdAt: Date;
                        updatedAt: Date;
                        accountId: string | null;
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
                    }[];
                    allowances: {
                        id: string;
                        householdId: string;
                        memberId: string;
                        createdAt: Date;
                        title: string;
                        limitAmount: import("@prisma/client/runtime/library").Decimal;
                        spentAmount: import("@prisma/client/runtime/library").Decimal;
                        period: import(".prisma/client").$Enums.RecurrencePeriod;
                    }[];
                    accounts: {
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
                    }[];
                    categories: {
                        id: string;
                        householdId: string | null;
                        name: string;
                        createdAt: Date;
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
                    reminders: {
                        id: string;
                        householdId: string;
                        createdAt: Date;
                        title: string;
                        dueDate: Date;
                        amount: import("@prisma/client/runtime/library").Decimal;
                        isPaid: boolean;
                        subscriptionId: string | null;
                        debtId: string | null;
                    }[];
                    assets: {
                        id: string;
                        householdId: string;
                        name: string;
                        type: string;
                        createdAt: Date;
                        updatedAt: Date;
                        notes: string | null;
                        debtId: string | null;
                        value: import("@prisma/client/runtime/library").Decimal;
                        purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
                        acquisitionDate: Date | null;
                    }[];
                } & {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                userId: string;
                householdId: string;
                role: import(".prisma/client").$Enums.Role;
                customTitle: string | null;
                joinedAt: Date;
            })[];
            auditLogs: {
                id: string;
                action: string;
                details: string | null;
                timestamp: Date;
                userId: string;
                householdId: string;
            }[];
            notifications: {
                id: string;
                userId: string;
                householdId: string;
                type: string;
                createdAt: Date;
                title: string;
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
