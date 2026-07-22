import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
export declare class RemindersService {
    private prisma;
    private eventsGateway;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    findAll(householdId: string): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        title: string;
        dueDate: Date;
        isPaid: boolean;
    }[]>;
    create(householdId: string, data: {
        title: string;
        amount: number;
        dueDate: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        title: string;
        dueDate: Date;
        isPaid: boolean;
    }>;
    togglePaid(householdId: string, reminderId: string): Promise<{
        id: string;
        createdAt: Date;
        householdId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        title: string;
        dueDate: Date;
        isPaid: boolean;
    } | {
        isPaid: boolean;
        message: string;
    }>;
    delete(householdId: string, reminderId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
