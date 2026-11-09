import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';
import { MitigationStrategy } from '@prisma/client';
export interface DebtOperationalDates {
    nextClosingDate: Date | null;
    daysUntilCutoff: number | null;
    nextPaymentDueDate: Date | null;
    daysUntilPaymentDue: number | null;
    isDueSoon: boolean;
    isOverdue: boolean;
    alertBadge: 'NORMAL' | 'DUE_SOON' | 'OVERDUE';
}
export declare class DebtsService {
    private prisma;
    private notificationsService;
    private eventsGateway;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, eventsGateway: EventsGateway);
    calculateOperationalDates(d: {
        cutoffDay?: number | null;
        paymentDueDay?: number | null;
        dueDate?: Date | string | null;
        alertDaysBefore?: number | null;
    }, now?: Date): DebtOperationalDates;
    private syncDebtReminder;
    findAll(householdId: string): Promise<any>;
    create(householdId: string, data: {
        contactName: string;
        totalAmount: number;
        remainingAmount?: number;
        interestRate?: number;
        dueDate?: string;
        targetPayoffDate?: string;
        monthlyTargetPayment?: number;
        mitigationStrategy?: MitigationStrategy;
        notes?: string;
        cutoffDay?: number;
        paymentDueDay?: number;
        minimumPayment?: number;
        alertDaysBefore?: number;
        autoAlert?: boolean;
    }): Promise<any>;
    update(householdId: string, debtId: string, data: {
        contactName?: string;
        totalAmount?: number;
        remainingAmount?: number;
        interestRate?: number;
        dueDate?: string;
        targetPayoffDate?: string;
        monthlyTargetPayment?: number;
        mitigationStrategy?: MitigationStrategy;
        notes?: string;
        isPaidOff?: boolean;
        cutoffDay?: number;
        paymentDueDay?: number;
        minimumPayment?: number;
        alertDaysBefore?: number;
        autoAlert?: boolean;
    }): Promise<any>;
    payDebt(householdId: string, debtId: string, data: {
        amount: number;
        accountId?: string;
        notes?: string;
    }, currentUserId?: string): Promise<any>;
    delete(householdId: string, id: string): Promise<{
        message: string;
    }>;
}
