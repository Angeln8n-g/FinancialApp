import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { TransactionType } from '@prisma/client';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const mockPrismaService = {
    account: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
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
        TransactionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventsGateway, useValue: mockEventsGateway },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException when amount is <= 0', async () => {
      await expect(
        service.create('household_1', {
          accountId: 'acc_1',
          type: TransactionType.EXPENSE,
          amount: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when source account does not exist in household', async () => {
      mockPrismaService.account.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.create('household_1', {
          accountId: 'non_existent_acc',
          type: TransactionType.EXPENSE,
          amount: 50,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create an EXPENSE transaction and decrement account balance', async () => {
      mockPrismaService.account.findFirst.mockResolvedValueOnce({
        id: 'acc_1',
        householdId: 'household_1',
        balance: 500,
      });

      const mockTx = {
        id: 'tx_1',
        accountId: 'acc_1',
        amount: 50,
        type: TransactionType.EXPENSE,
        householdId: 'household_1',
      };
      mockPrismaService.transaction.create.mockResolvedValueOnce(mockTx);

      const result = await service.create(
        'household_1',
        {
          accountId: 'acc_1',
          type: TransactionType.EXPENSE,
          amount: 50,
          description: 'Groceries',
        },
        'user_1',
      );

      expect(result).toEqual(mockTx);
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: 'acc_1' },
        data: { balance: { decrement: 50 } },
      });
      expect(mockEventsGateway.notifyHouseholdChange).toHaveBeenCalledWith(
        'household_1',
        'transaction',
        'CREATE',
      );
    });

    it('should create an INCOME transaction and increment account balance', async () => {
      mockPrismaService.account.findFirst.mockResolvedValueOnce({
        id: 'acc_1',
        householdId: 'household_1',
        balance: 500,
      });

      const mockTx = {
        id: 'tx_2',
        accountId: 'acc_1',
        amount: 200,
        type: TransactionType.INCOME,
        householdId: 'household_1',
      };
      mockPrismaService.transaction.create.mockResolvedValueOnce(mockTx);

      const result = await service.create('household_1', {
        accountId: 'acc_1',
        type: TransactionType.INCOME,
        amount: 200,
        description: 'Salary',
      });

      expect(result).toEqual(mockTx);
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: 'acc_1' },
        data: { balance: { increment: 200 } },
      });
    });

    it('should require destinationAccountId for TRANSFER transactions', async () => {
      mockPrismaService.account.findFirst.mockResolvedValueOnce({
        id: 'acc_1',
        householdId: 'household_1',
        balance: 500,
      });

      await expect(
        service.create('household_1', {
          accountId: 'acc_1',
          type: TransactionType.TRANSFER,
          amount: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
