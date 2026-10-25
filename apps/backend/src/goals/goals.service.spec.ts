import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GoalsService', () => {
  let service: GoalsService;

  const mockPrismaService = {
    savingsGoal: {
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
    transaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('contribute', () => {
    it('should throw BadRequestException if amount is <= 0', async () => {
      await expect(
        service.contribute('hh-1', 'goal-1', { amount: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if goal is not found', async () => {
      mockPrismaService.savingsGoal.findFirst.mockResolvedValue(null);

      await expect(
        service.contribute('hh-1', 'goal-1', { amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should contribute directly without account deduction', async () => {
      mockPrismaService.savingsGoal.findFirst.mockResolvedValue({
        id: 'goal-1',
        name: 'Fondo Emergencia',
        targetAmount: 1000,
        currentAmount: 200,
      });

      mockPrismaService.savingsGoal.update.mockResolvedValue({
        id: 'goal-1',
        name: 'Fondo Emergencia',
        targetAmount: 1000,
        currentAmount: 300,
      });

      const res = await service.contribute('hh-1', 'goal-1', { amount: 100 });
      expect(mockPrismaService.savingsGoal.update).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
        data: { currentAmount: { increment: 100 } },
      });
      expect(mockPrismaService.account.update).not.toHaveBeenCalled();
      expect(res.currentAmount).toBe(300);
    });

    it('should deduct from account when accountId is provided', async () => {
      mockPrismaService.savingsGoal.findFirst.mockResolvedValue({
        id: 'goal-1',
        name: 'Vacaciones',
        targetAmount: 2000,
        currentAmount: 500,
      });

      mockPrismaService.account.findFirst.mockResolvedValue({
        id: 'acc-1',
        name: 'Banco Principal',
        balance: 1500,
      });

      mockPrismaService.savingsGoal.update.mockResolvedValue({
        id: 'goal-1',
        currentAmount: 650,
      });

      await service.contribute('hh-1', 'goal-1', { amount: 150, accountId: 'acc-1' }, 'user-1');

      expect(mockPrismaService.transaction.create).toHaveBeenCalled();
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { balance: { decrement: 150 } },
      });
      expect(mockPrismaService.savingsGoal.update).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
        data: { currentAmount: { increment: 150 } },
      });
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if goal does not exist', async () => {
      mockPrismaService.savingsGoal.findFirst.mockResolvedValue(null);

      await expect(
        service.update('hh-1', 'goal-non-existent', { name: 'Nuevo Nombre' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update goal name and targetAmount', async () => {
      mockPrismaService.savingsGoal.findFirst.mockResolvedValue({
        id: 'goal-1',
        name: 'Viejo Nombre',
      });
      mockPrismaService.savingsGoal.update.mockResolvedValue({
        id: 'goal-1',
        name: 'Nuevo Nombre',
        targetAmount: 3500,
      });

      const res = await service.update('hh-1', 'goal-1', {
        name: 'Nuevo Nombre',
        targetAmount: 3500,
      });

      expect(mockPrismaService.savingsGoal.update).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
        data: { name: 'Nuevo Nombre', targetAmount: 3500 },
      });
      expect(res.name).toBe('Nuevo Nombre');
    });
  });
});
