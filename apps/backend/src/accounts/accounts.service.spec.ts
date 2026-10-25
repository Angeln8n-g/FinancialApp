import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { AccountType, PayrollFrequency } from '@prisma/client';

describe('AccountsService', () => {
  let service: AccountsService;

  const mockPrismaService = {
    account: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockEventsGateway = {
    notifyHouseholdChange: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventsGateway, useValue: mockEventsGateway },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isPayrollDue', () => {
    it('should return false if payrollAutoDeposit is false', () => {
      const account = {
        payrollAutoDeposit: false,
        payrollAmount: 1500,
        payrollFrequency: PayrollFrequency.BIWEEKLY,
      };
      expect(service.isPayrollDue(account, new Date(2026, 9, 15))).toBe(false);
    });

    it('should return false if payrollAmount is 0 or null', () => {
      const account = {
        payrollAutoDeposit: true,
        payrollAmount: 0,
        payrollFrequency: PayrollFrequency.BIWEEKLY,
      };
      expect(service.isPayrollDue(account, new Date(2026, 9, 15))).toBe(false);
    });

    it('should detect biweekly period 1 due on day 15', () => {
      const account = {
        payrollAutoDeposit: true,
        payrollAmount: 1500,
        payrollFrequency: PayrollFrequency.BIWEEKLY,
        payrollDay1: 15,
        payrollDay2: 30,
        lastPayrollDeposit: null,
      };
      // 15 de Octubre 2026
      expect(service.isPayrollDue(account, new Date(2026, 9, 15))).toBe(true);
    });

    it('should return false if biweekly period 1 was already deposited', () => {
      const account = {
        payrollAutoDeposit: true,
        payrollAmount: 1500,
        payrollFrequency: PayrollFrequency.BIWEEKLY,
        payrollDay1: 15,
        payrollDay2: 30,
        // Ya depositado el día 15 de este mes
        lastPayrollDeposit: new Date(2026, 9, 15, 8, 0, 0),
      };
      expect(service.isPayrollDue(account, new Date(2026, 9, 15, 12, 0, 0))).toBe(false);
    });

    it('should detect biweekly period 2 due on day 30', () => {
      const account = {
        payrollAutoDeposit: true,
        payrollAmount: 1500,
        payrollFrequency: PayrollFrequency.BIWEEKLY,
        payrollDay1: 15,
        payrollDay2: 30,
        // Periodo 1 ya depositado el 15
        lastPayrollDeposit: new Date(2026, 9, 15),
      };
      // 30 de Octubre 2026
      expect(service.isPayrollDue(account, new Date(2026, 9, 30))).toBe(true);
    });

    it('should detect monthly due on day 30', () => {
      const account = {
        payrollAutoDeposit: true,
        payrollAmount: 3000,
        payrollFrequency: PayrollFrequency.MONTHLY,
        payrollDay1: 30,
        lastPayrollDeposit: new Date(2026, 8, 30), // Mes pasado
      };
      // 30 de Octubre 2026
      expect(service.isPayrollDue(account, new Date(2026, 9, 30))).toBe(true);
    });

    it('should return false for monthly if already deposited in the current month', () => {
      const account = {
        payrollAutoDeposit: true,
        payrollAmount: 3000,
        payrollFrequency: PayrollFrequency.MONTHLY,
        payrollDay1: 30,
        lastPayrollDeposit: new Date(2026, 9, 30), // Mismo mes
      };
      expect(service.isPayrollDue(account, new Date(2026, 9, 30))).toBe(false);
    });
  });

  describe('manualPayrollDeposit', () => {
    it('should throw BadRequestException if account has no payroll amount', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue({
        id: 'acc-1',
        name: 'Cuenta Normal',
        type: AccountType.BANK_ACCOUNT,
        payrollAmount: null,
      });

      await expect(
        service.manualPayrollDeposit('hh-1', 'acc-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully execute manual deposit and increment balance', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue({
        id: 'acc-1',
        householdId: 'hh-1',
        name: 'Nómina Santander',
        type: AccountType.PAYROLL,
        balance: 1000,
        payrollAmount: 2500,
        payrollFrequency: PayrollFrequency.MONTHLY,
      });

      mockPrismaService.category.findFirst.mockResolvedValue({
        id: 'cat-payroll',
        name: 'Nómina',
      });

      mockPrismaService.transaction.create.mockResolvedValue({
        id: 'tx-1',
        amount: 2500,
        type: 'INCOME',
      });

      mockPrismaService.account.update.mockResolvedValue({
        id: 'acc-1',
        balance: 3500,
      });

      const res = await service.manualPayrollDeposit('hh-1', 'acc-1', 'user-1');

      expect(mockPrismaService.transaction.create).toHaveBeenCalled();
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: {
          balance: { increment: 2500 },
          lastPayrollDeposit: expect.any(Date),
        },
      });
      expect(mockEventsGateway.notifyHouseholdChange).toHaveBeenCalledWith('hh-1', 'transaction', 'CREATE');
      expect(mockEventsGateway.notifyHouseholdChange).toHaveBeenCalledWith('hh-1', 'account', 'UPDATE');
      expect(res.account.balance).toBe(3500);
    });
  });
});
