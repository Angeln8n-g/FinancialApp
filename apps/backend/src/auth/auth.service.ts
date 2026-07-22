import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private hashPassword(password: string): string {
    const salt = 'hogariq_dev_salt';
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            household: true,
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const hashedPassword = this.hashPassword(password);
    if (user.passwordHash !== hashedPassword) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const primaryMembership = user.memberships[0];
    const householdId = primaryMembership ? primaryMembership.householdId : null;

    const payload = {
      sub: user.id,
      email: user.email,
      householdId,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
      household: primaryMembership?.household ? {
        id: primaryMembership.household.id,
        name: primaryMembership.household.name,
        role: primaryMembership.role,
      } : null,
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El correo ya se encuentra registrado');
    }

    const passwordHash = this.hashPassword(password);

    const result = await this.prisma.$transaction(async (tx) => {
      const household = await tx.household.create({
        data: {
          name: `Hogar de ${fullName.split(' ')[0]}`,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          fullName,
          passwordHash,
        },
      });

      const membership = await tx.householdMember.create({
        data: {
          userId: user.id,
          householdId: household.id,
          role: 'ADMIN',
        },
      });

      const defaultCategories = [
        { name: 'Comida', icon: '🍽️', color: '#FF5733' },
        { name: 'Transporte', icon: '🚗', color: '#33FF57' },
        { name: 'Servicios', icon: '💡', color: '#3357FF' },
        { name: 'Suscripciones', icon: '📺', color: '#F333FF' },
        { name: 'Ahorros', icon: '🏦', color: '#FFC300' },
      ];

      for (const cat of defaultCategories) {
        await tx.category.create({
          data: {
            householdId: household.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
          },
        });
      }

      return { user, household, membership };
    });

    const payload = {
      sub: result.user.id,
      email: result.user.email,
      householdId: result.household.id,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
      },
      household: {
        id: result.household.id,
        name: result.household.name,
        role: result.membership.role,
      },
    };
  }

  async getMe(userId: string, householdId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            household: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const currentMembership = user.memberships.find(m => m.householdId === householdId) || user.memberships[0];

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      },
      household: currentMembership?.household ? {
        id: currentMembership.household.id,
        name: currentMembership.household.name,
        role: currentMembership.role,
      } : null,
    };
  }
}
