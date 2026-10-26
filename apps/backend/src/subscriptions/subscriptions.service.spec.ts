import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';
import { RecurrencePeriod } from '@prisma/client';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  const mockPrismaService = {
    subscription: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    reminder: {
      updateMany: jest.fn(),
    },
    householdMember: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockNotificationsService = {
    createNotification: jest.fn(),
  };

  const mockEventsGateway = {
    notifyHouseholdChange: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: EventsGateway, useValue: mockEventsGateway },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateNextBillingDate', () => {
    it('should add 1 month for MONTHLY period', () => {
      const date = new Date(2026, 9, 15); // 15 de Octubre 2026
      const next = service.calculateNextBillingDate(date, RecurrencePeriod.MONTHLY);
      expect(next.getMonth()).toBe(10); // Noviembre
      expect(next.getFullYear()).toBe(2026);
    });

    it('should add 1 year for YEARLY period', () => {
      const date = new Date(2026, 9, 15);
      const next = service.calculateNextBillingDate(date, RecurrencePeriod.YEARLY);
      expect(next.getFullYear()).toBe(2027);
      expect(next.getMonth()).toBe(9);
    });

    it('should add 7 days for WEEKLY period', () => {
      const date = new Date(2026, 9, 15);
      const next = service.calculateNextBillingDate(date, RecurrencePeriod.WEEKLY);
      expect(next.getDate()).toBe(22);
    });
  });

  describe('deductSubscription', () => {
    it('should throw BadRequestException if subscription has no accountId', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        householdId: 'hh-1',
        name: 'Spotify',
        cost: 9.99,
        accountId: null,
      });

      await expect(
        service.deductSubscription('hh-1', 'sub-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully deduct when account has sufficient funds', async () => {
      const billingDate = new Date(2026, 9, 15);
      mockPrismaService.subscription.findFirst.mockResolvedValue({
        id: 'sub-1',
        householdId: 'hh-1',
        name: 'Netflix',
        cost: 15.0,
        period: RecurrencePeriod.MONTHLY,
        nextBillingDate: billingDate,
        accountId: 'acc-1',
      });

      mockPrismaService.account.findFirst.mockResolvedValue({
        id: 'acc-1',
        householdId: 'hh-1',
        name: 'Banco Principal',
        balance: 100.0,
      });

      mockPrismaService.category.findFirst.mockResolvedValue({
        id: 'cat-servicios',
        name: 'Servicios',
      });

      mockPrismaService.transaction.create.mockResolvedValue({
        id: 'tx-1',
        amount: 15.0,
      });

      mockPrismaService.account.update.mockResolvedValue({
        id: 'acc-1',
        balance: 85.0,
      });

      mockPrismaService.subscription.update.mockResolvedValue({
        id: 'sub-1',
      });

      mockPrismaService.householdMember.findMany.mockResolvedValue([
        { userId: 'user-1' },
      ]);

      const res = await service.deductSubscription('hh-1', 'sub-1', 'user-1');

      expect(res.success).toBe(true);
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { balance: { decrement: 15.0 } },
      });
      expect(mockPrismaService.transaction.create).toHaveBeenCalled();
      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SUBSCRIPTION_DEDUCTED',
          userId: 'user-1',
        }),
      );
      expect(mockEventsGateway.notifyHouseholdChange).toHaveBeenCalledWith('hh-1', 'transaction', 'CREATE');
    });

    it('should deduct and assign explicit categoryId to transaction when subscription has categoryId', async () => {
      const billingDate = new Date(2026, 9, 15);
      mockPrismaService.subscription.findFirst.mockResolvedValue({
        id: 'sub-ent',
        householdId: 'hh-1',
        name: 'Disney+',
        cost: 12.0,
        period: RecurrencePeriod.MONTHLY,
        nextBillingDate: billingDate,
        accountId: 'acc-1',
        categoryId: 'cat-ent',
      });

      mockPrismaService.account.findFirst.mockResolvedValue({
        id: 'acc-1',
        householdId: 'hh-1',
        name: 'Banco Principal',
        balance: 100.0,
      });

      mockPrismaService.transaction.create.mockResolvedValue({
        id: 'tx-2',
        amount: 12.0,
        categoryId: 'cat-ent',
      });

      mockPrismaService.account.update.mockResolvedValue({
        id: 'acc-1',
        balance: 88.0,
      });

      mockPrismaService.subscription.update.mockResolvedValue({ id: 'sub-ent' });
      mockPrismaService.householdMember.findMany.mockResolvedValue([{ userId: 'user-1' }]);

      const res = await service.deductSubscription('hh-1', 'sub-ent', 'user-1');

      expect(res.success).toBe(true);
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          categoryId: 'cat-ent',
          amount: 12.0,
        }),
      });
      expect(mockEventsGateway.notifyHouseholdChange).toHaveBeenCalledWith('hh-1', 'budget', 'UPDATE');
    });

    it('should not deduct money and send alert notification when funds are insufficient', async () => {
      mockPrismaService.subscription.findFirst.mockResolvedValue({
        id: 'sub-2',
        householdId: 'hh-1',
        name: 'Gimnasio',
        cost: 50.0,
        accountId: 'acc-1',
      });

      mockPrismaService.account.findFirst.mockResolvedValue({
        id: 'acc-1',
        householdId: 'hh-1',
        name: 'Efectivo',
        balance: 20.0, // Insuficiente: 20 < 50
      });

      mockPrismaService.householdMember.findMany.mockResolvedValue([
        { userId: 'user-1' },
      ]);

      const res = await service.deductSubscription('hh-1', 'sub-2');

      expect(res.success).toBe(false);
      expect(res.reason).toBe('INSUFFICIENT_FUNDS');
      // No debe actualizar saldo
      expect(mockPrismaService.account.update).not.toHaveBeenCalled();
      // No debe crear transacción de gasto
      expect(mockPrismaService.transaction.create).not.toHaveBeenCalled();
      // Debe crear notificación de fondos insuficientes
      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SUBSCRIPTION_FAILED_FUNDS',
          title: expect.stringContaining('Fondos insuficientes'),
        }),
      );
    });
  });
});
