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
});
