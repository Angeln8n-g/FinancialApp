import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';
import { MitigationStrategy } from '@prisma/client';

describe('DebtsService', () => {
  let service: DebtsService;

  const mockPrismaService = {
    debt: {
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
        DebtsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: EventsGateway, useValue: mockEventsGateway },
      ],
    }).compile();

    service = module.get<DebtsService>(DebtsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should compute mitigation progress, months remaining and suggested monthly payment', async () => {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + 10); // 10 meses hacia adelante

      mockPrismaService.debt.findMany.mockResolvedValue([
        {
          id: 'debt-1',
          contactName: 'Banco Santander',
          type: 'OWED_BY_ME',
          totalAmount: 10000,
          remainingAmount: 4000,
          interestRate: 12.5,
          targetPayoffDate: targetDate,
          mitigationStrategy: MitigationStrategy.AVALANCHE,
          isPaidOff: false,
        },
      ]);

      const res = await service.findAll('hh-1');
      expect(res).toHaveLength(1);
      const d = res[0];
      expect(d.paidAmount).toBe(6000);
      expect(d.progressPercentage).toBe(60);
      expect(d.isPaidOff).toBe(false);
      expect(d.monthsRemaining).toBe(10);
      expect(d.suggestedMonthlyPayment).toBe(400); // 4000 / 10
      expect(d.mitigationStrategy).toBe(MitigationStrategy.AVALANCHE);
    });
  });

  describe('payDebt', () => {
    it('should throw BadRequestException if amount <= 0', async () => {
      await expect(
        service.payDebt('hh-1', 'debt-1', { amount: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if debt is not found', async () => {
      mockPrismaService.debt.findFirst.mockResolvedValue(null);

      await expect(
        service.payDebt('hh-1', 'debt-non-existent', { amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if account has insufficient funds', async () => {
      mockPrismaService.debt.findFirst.mockResolvedValue({
        id: 'debt-1',
        householdId: 'hh-1',
        contactName: 'Préstamo Personal',
        remainingAmount: 1000,
      });

      mockPrismaService.account.findFirst.mockResolvedValue({
        id: 'acc-1',
        householdId: 'hh-1',
        name: 'Banco Débito',
        balance: 100, // Menor que 500
      });

      await expect(
        service.payDebt('hh-1', 'debt-1', { amount: 500, accountId: 'acc-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully make payment, deduct account balance and update debt', async () => {
      mockPrismaService.debt.findFirst.mockResolvedValue({
        id: 'debt-1',
        householdId: 'hh-1',
        contactName: 'Tarjeta Visa',
        remainingAmount: 800,
      });

      mockPrismaService.account.findFirst.mockResolvedValue({
        id: 'acc-1',
        householdId: 'hh-1',
        name: 'Banco Santander',
        balance: 1500,
      });

      mockPrismaService.category.findFirst.mockResolvedValue({
        id: 'cat-debt',
        name: 'Pago de Deuda',
      });

      mockPrismaService.transaction.create.mockResolvedValue({
        id: 'tx-1',
        amount: 300,
      });

      mockPrismaService.account.update.mockResolvedValue({
        id: 'acc-1',
        balance: 1200,
      });

      mockPrismaService.debt.update.mockResolvedValue({
        id: 'debt-1',
        remainingAmount: 500,
        isPaidOff: false,
      });

      mockPrismaService.householdMember.findMany.mockResolvedValue([{ userId: 'user-1' }]);

      const res = await service.payDebt('hh-1', 'debt-1', { amount: 300, accountId: 'acc-1' }, 'user-1');

      expect(res.success).toBe(true);
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { balance: { decrement: 300 } },
      });
      expect(mockPrismaService.debt.update).toHaveBeenCalledWith({
        where: { id: 'debt-1' },
        data: { remainingAmount: 500, isPaidOff: false },
      });
      expect(mockNotificationsService.createNotification).toHaveBeenCalled();
      expect(mockEventsGateway.notifyHouseholdChange).toHaveBeenCalledWith('hh-1', 'debt', 'UPDATE');
    });

    it('should mark debt as isPaidOff when paid completely', async () => {
      mockPrismaService.debt.findFirst.mockResolvedValue({
        id: 'debt-1',
        householdId: 'hh-1',
        contactName: 'Préstamo Rápido',
        remainingAmount: 200,
      });

      mockPrismaService.debt.update.mockResolvedValue({
        id: 'debt-1',
        remainingAmount: 0,
        isPaidOff: true,
      });

      mockPrismaService.householdMember.findMany.mockResolvedValue([{ userId: 'user-1' }]);

      const res = await service.payDebt('hh-1', 'debt-1', { amount: 200 });

      expect(res.success).toBe(true);
      expect(mockPrismaService.debt.update).toHaveBeenCalledWith({
        where: { id: 'debt-1' },
        data: { remainingAmount: 0, isPaidOff: true },
      });
      expect(mockPrismaService.reminder.updateMany).toHaveBeenCalledWith({
        where: { debtId: 'debt-1', isPaid: false },
        data: { isPaid: true },
      });
    });
  });
});
