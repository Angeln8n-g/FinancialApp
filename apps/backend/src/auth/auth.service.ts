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
            household: {
              include: {
                members: true,
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas o cuenta no activada');
    }

    const hashedPassword = this.hashPassword(password);
    if (user.passwordHash !== hashedPassword) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Seleccionar la membresía compartida con más miembros o la más reciente
    const sharedMembership = user.memberships.find(m => m.household.members.length > 1);
    const primaryMembership = sharedMembership || user.memberships[0];
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
      availableHouseholds: user.memberships.map(m => ({
        id: m.household.id,
        name: m.household.name,
        role: m.role,
        memberCount: m.household.members.length,
      })),
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: { household: true },
        },
      },
    });

    const passwordHash = this.hashPassword(password);

    // Caso A: Usuario fue pre-creado vía invitación sin clave aún
    if (existingUser) {
      if (existingUser.passwordHash) {
        throw new ConflictException('El correo ya se encuentra registrado. Por favor inicia sesión.');
      }

      // Activar cuenta del usuario invitado
      const updatedUser = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          fullName: fullName || existingUser.fullName,
          passwordHash,
        },
        include: {
          memberships: {
            include: { household: true },
            orderBy: { joinedAt: 'desc' },
          },
        },
      });

      const primaryMembership = updatedUser.memberships[0];
      const payload = {
        sub: updatedUser.id,
        email: updatedUser.email,
        householdId: primaryMembership ? primaryMembership.householdId : null,
      };

      const token = this.jwtService.sign(payload);

      return {
        accessToken: token,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
        },
        household: primaryMembership?.household ? {
          id: primaryMembership.household.id,
          name: primaryMembership.household.name,
          role: primaryMembership.role,
        } : null,
      };
    }

    // Caso B: Nuevo usuario independiente
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

  async switchHousehold(userId: string, targetHouseholdId: string) {
    const membership = await this.prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId: targetHouseholdId,
        },
      },
      include: {
        user: true,
        household: true,
      },
    });

    if (!membership) {
      throw new UnauthorizedException('No perteneces a este hogar');
    }

    const payload = {
      sub: membership.userId,
      email: membership.user.email,
      householdId: targetHouseholdId,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: membership.user.id,
        email: membership.user.email,
        fullName: membership.user.fullName,
        avatarUrl: membership.user.avatarUrl,
      },
      household: {
        id: membership.household.id,
        name: membership.household.name,
        role: membership.role,
      },
    };
  }

  async getMe(userId: string, householdId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            household: {
              include: { members: true },
            },
          },
          orderBy: { joinedAt: 'desc' },
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
      availableHouseholds: user.memberships.map(m => ({
        id: m.household.id,
        name: m.household.name,
        role: m.role,
        memberCount: m.household.members.length,
      })),
    };
  }
}
