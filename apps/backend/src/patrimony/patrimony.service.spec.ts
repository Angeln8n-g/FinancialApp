import { Test, TestingModule } from '@nestjs/testing';
import { PatrimonyService } from './patrimony.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PatrimonyService', () => {
  let service: PatrimonyService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      asset: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      assetValuation: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      account: {
        findMany: jest.fn(),
      },
      debt: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatrimonyService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PatrimonyService>(PatrimonyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNetWorth', () => {
    it('should calculate net worth, solvency, leverage, and asset allocation correctly', async () => {
      const mockAssets = [
        {
          id: 'asset-1',
          name: 'Casa Principal',
          type: 'REAL_ESTATE',
          value: '150000',
          purchasePrice: '120000',
          acquisitionDate: new Date('2020-01-01'),
          debtId: 'debt-1',
          debt: {
            id: 'debt-1',
            contactName: 'Hipoteca Banco',
            remainingAmount: '90000',
            totalAmount: '100000',
            interestRate: '8.5',
          },
          valuations: [
            { id: 'v-1', value: '150000', notes: 'Tasación 2026', valuationDate: new Date() },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'asset-2',
          name: 'Portafolio ETF',
          type: 'INVESTMENT',
          value: '30000',
          purchasePrice: '25000',
          acquisitionDate: new Date('2022-01-01'),
          debtId: null,
          debt: null,
          valuations: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockAccounts = [
        { id: 'acc-1', name: 'Cuenta Nómina', type: 'CHECKING', balance: '10000' },
        { id: 'acc-2', name: 'Ahorros', type: 'SAVINGS', balance: '10000' },
      ];

      const mockDebts = [
        {
          id: 'debt-1',
          contactName: 'Hipoteca Banco',
          remainingAmount: '90000',
          totalAmount: '100000',
          interestRate: '8.5',
          targetPayoffDate: null,
          isPaidOff: false,
        },
      ];

      prisma.asset.findMany.mockResolvedValue(mockAssets);
      prisma.account.findMany.mockResolvedValue(mockAccounts);
      prisma.debt.findMany.mockResolvedValue(mockDebts);

      const result = await service.getNetWorth('h-1');

      // Assets: 150000 + 30000 = 180000. Accounts: 20000. Total Assets = 200000
      expect(result.totalAssets).toBe(200000);
      // Liquid Assets: 20000 accounts + 30000 investment = 50000
      expect(result.liquidAssets).toBe(50000);
      // Fixed Assets: 150000 real estate
      expect(result.fixedAssets).toBe(150000);
      // Liabilities: 90000
      expect(result.totalLiabilities).toBe(90000);
      // Net Worth: 200000 - 90000 = 110000
      expect(result.netWorth).toBe(110000);
      // Liquid Net Worth: 50000 - 90000 = -40000
      expect(result.liquidNetWorth).toBe(-40000);
      // Solvency Ratio: 200000 / 90000 = 2.22
      expect(result.solvencyRatio).toBe(2.22);
      // Debt to Asset Ratio: (90000 / 200000) * 100 = 45%
      expect(result.debtToAssetRatio).toBe(45);
      // Total Appreciation: (150000 - 120000) + (30000 - 25000) = 35000
      expect(result.totalAppreciation).toBe(35000);

      // Verify asset equity with linked debt: 150000 - 90000 = 60000
      const house = result.assetsList.find((a) => a.id === 'asset-1');
      expect(house?.netEquity).toBe(60000);
      expect(house?.appreciationAmount).toBe(30000);
      expect(house?.appreciationPercentage).toBe(25); // 30000/120000 = 25%
    });
  });

  describe('createAsset', () => {
    it('should create an asset and its initial valuation in a transaction', async () => {
      const createdAsset = {
        id: 'new-asset',
        householdId: 'h-1',
        name: 'Auto Familiar',
        type: 'VEHICLE',
        value: 15000,
        purchasePrice: 18000,
        acquisitionDate: new Date('2023-01-01'),
      };

      prisma.asset.create.mockResolvedValue(createdAsset);
      prisma.assetValuation.create.mockResolvedValue({ id: 'val-1', assetId: 'new-asset', value: 15000 });

      const res = await service.createAsset('h-1', {
        name: 'Auto Familiar',
        type: 'VEHICLE',
        value: 15000,
        purchasePrice: 18000,
        acquisitionDate: '2023-01-01',
      });

      expect(res).toEqual(createdAsset);
      expect(prisma.asset.create).toHaveBeenCalled();
      expect(prisma.assetValuation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            asset: { connect: { id: 'new-asset' } },
            value: 15000,
          }),
        }),
      );
    });
  });

  describe('updateAsset', () => {
    it('should update an existing asset', async () => {
      prisma.asset.findFirst.mockResolvedValue({ id: 'asset-1', householdId: 'h-1' });
      prisma.asset.update.mockResolvedValue({ id: 'asset-1', name: 'Auto Actualizado' });

      const res = await service.updateAsset('h-1', 'asset-1', { name: 'Auto Actualizado' });
      expect(res.name).toBe('Auto Actualizado');
    });

    it('should throw NotFoundException if asset does not exist', async () => {
      prisma.asset.findFirst.mockResolvedValue(null);

      await expect(
        service.updateAsset('h-1', 'non-existent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAssetValuation', () => {
    it('should record a new valuation and update the asset current value', async () => {
      prisma.asset.findFirst.mockResolvedValue({ id: 'asset-1', householdId: 'h-1', value: 10000 });
      prisma.assetValuation.create.mockResolvedValue({ id: 'val-new', assetId: 'asset-1', value: 12000 });
      prisma.asset.update.mockResolvedValue({ id: 'asset-1', value: 12000 });

      const res = await service.updateAssetValuation('h-1', 'asset-1', {
        value: 12000,
        notes: 'Tasación anual 2026',
      });

      expect(res.asset.value).toBe(12000);
      expect(res.valuation.value).toBe(12000);
    });
  });

  describe('deleteAsset', () => {
    it('should delete an asset when found', async () => {
      prisma.asset.findFirst.mockResolvedValue({ id: 'asset-1', householdId: 'h-1' });
      prisma.asset.delete.mockResolvedValue({ id: 'asset-1' });

      const res = await service.deleteAsset('h-1', 'asset-1');
      expect(res.id).toBe('asset-1');
    });

    it('should throw NotFoundException when deleting non-existent asset', async () => {
      prisma.asset.findFirst.mockResolvedValue(null);

      await expect(service.deleteAsset('h-1', 'asset-not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
