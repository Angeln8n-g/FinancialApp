import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteMemberDto, UpdateRoleDto } from './household.dto';
import { Role } from '@prisma/client';

@Injectable()
export class HouseholdService {
  constructor(private prisma: PrismaService) {}

  async getMembers(householdId: string) {
    const members = await this.prisma.householdMember.findMany({
      where: { householdId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map(m => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      fullName: m.user.fullName,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  async inviteMember(currentUserId: string, householdId: string, dto: InviteMemberDto) {
    const currentMember = await this.prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: currentUserId,
          householdId,
        },
      },
    });

    if (!currentMember || currentMember.role !== Role.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden invitar nuevos miembros');
    }

    let targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!targetUser) {
      targetUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          fullName: dto.email.split('@')[0],
        },
      });
    }

    const existingMembership = await this.prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: targetUser.id,
          householdId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('El usuario ya pertenece a este hogar');
    }

    return this.prisma.householdMember.create({
      data: {
        userId: targetUser.id,
        householdId,
        role: dto.role || Role.COLLABORATOR,
      },
      include: {
        user: true,
      },
    });
  }

  async updateRole(currentUserId: string, householdId: string, memberId: string, dto: UpdateRoleDto) {
    const currentMember = await this.prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: currentUserId,
          householdId,
        },
      },
    });

    if (!currentMember || currentMember.role !== Role.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden cambiar roles');
    }

    const memberToUpdate = await this.prisma.householdMember.findFirst({
      where: { id: memberId, householdId },
    });

    if (!memberToUpdate) {
      throw new NotFoundException('Miembro no encontrado en este hogar');
    }

    return this.prisma.householdMember.update({
      where: { id: memberId },
      data: { role: dto.role },
    });
  }
}
