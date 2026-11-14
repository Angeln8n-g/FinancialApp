import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock_jwt_token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Password Hashing & Verification', () => {
    it('should generate a secure pbkdf2 hash with 100,000 iterations and salt', () => {
      const password = 'mySecretPassword123!';
      const hash = (service as any).hashPassword(password);

      expect(hash).toMatch(/^pbkdf2\$100000\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    });

    it('should correctly verify passwords hashed with the new secure format', () => {
      const password = 'mySecretPassword123!';
      const hash = (service as any).hashPassword(password);

      const isValid = (service as any).verifyPassword(password, hash);
      const isInvalid = (service as any).verifyPassword('wrongPassword', hash);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    it('should support backward compatibility with legacy 1,000 iterations static salt hashes', () => {
      // Legacy hash generated with 'hogariq_dev_salt' and 1000 iterations
      const crypto = require('crypto');
      const password = 'adminLegacyPassword';
      const legacyHash = crypto.pbkdf2Sync(password, 'hogariq_dev_salt', 1000, 64, 'sha512').toString('hex');

      const isValid = (service as any).verifyPassword(password, legacyHash);
      const isInvalid = (service as any).verifyPassword('wrongPassword', legacyHash);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Child Account Registration with Parental Control', () => {
    it('should require parentEmail when isChildAccount is true', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.register({
          email: 'nino@familia.com',
          password: 'password123',
          fullName: 'Mateo Niño',
          isChildAccount: true,
        }),
      ).rejects.toThrow('Debes ingresar el correo electrónico del padre o tutor para activar el control parental.');
    });

    it('should automatically link child account to parent email household and provision exclusive child account', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'parent-user-1',
              email: 'padre@familia.com',
              fullName: 'Papá Tutor',
              memberships: [
                {
                  id: 'parent-member-1',
                  role: 'ADMIN',
                  household: { id: 'hh-1', name: 'Hogar de Papá', baseCurrency: 'USD' },
                },
              ],
            }),
            create: jest.fn().mockResolvedValue({
              id: 'child-user-1',
              email: 'nino@familia.com',
              fullName: 'Mateo Niño',
            }),
          },
          householdMember: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'child-member-1',
              userId: 'child-user-1',
              householdId: 'hh-1',
              role: 'DEPENDENT',
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          account: {
            create: jest.fn().mockResolvedValue({
              id: 'child-acc-1',
              name: 'Cuenta de Niño • Mateo Niño',
              balance: 0,
            }),
          },
          allowance: {
            create: jest.fn().mockResolvedValue({ id: 'allow-1' }),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
          },
          notification: {
            create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
          },
        };
        return cb(tx);
      });

      const res = await service.register({
        email: 'nino@familia.com',
        password: 'password123',
        fullName: 'Mateo Niño',
        isChildAccount: true,
        parentEmail: 'padre@familia.com',
      });

      expect(res.user.isChildAccount).toBe(true);
      expect(res.user.parentEmail).toBe('padre@familia.com');
      expect(res.user.childAccountId).toBe('child-acc-1');
      expect(res.household.role).toBe('DEPENDENT');
      expect(res.household.isChildAccount).toBe(true);
      expect(res.household.parentEmail).toBe('padre@familia.com');
    });
  });
});
