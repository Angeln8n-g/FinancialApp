import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
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
      customTitle: m.customTitle,
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

    // Generar código único de invitación (ej. HOGAR-X7Y9)
    const code = 'HIQ-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

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

    const member = await this.prisma.householdMember.create({
      data: {
        userId: targetUser.id,
        householdId,
        role: dto.role || Role.COLLABORATOR,
      },
      include: { user: true },
    });

    const invitation = await this.prisma.householdInvitation.create({
      data: {
        householdId,
        email: dto.email,
        role: dto.role || Role.COLLABORATOR,
        code,
        expiresAt,
      },
    });

    // Registrar en AuditLog
    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        householdId,
        action: 'INVITE_MEMBER',
        details: `Invitó a ${dto.email} como ${dto.role || Role.COLLABORATOR} (Código: ${code})`,
      },
    });

    return {
      member,
      invitationCode: code,
      inviteLink: `http://localhost:3001/invite/${code}`,
    };
  }

  async getInvitations(householdId: string) {
    return this.prisma.householdInvitation.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async joinByCode(userId: string, code: string) {
    const invitation = await this.prisma.householdInvitation.findUnique({
      where: { code },
    });

    if (!invitation || invitation.status !== 'PENDING') {
      throw new NotFoundException('Invitación no válida o expirada');
    }

    const existingMembership = await this.prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId: invitation.householdId,
        },
      },
    });

    if (existingMembership) {
      return { message: 'Ya eres miembro de este hogar', householdId: invitation.householdId };
    }

    await this.prisma.householdMember.create({
      data: {
        userId,
        householdId: invitation.householdId,
        role: invitation.role,
      },
    });

    await this.prisma.householdInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        householdId: invitation.householdId,
        action: 'JOIN_HOUSEHOLD',
        details: `Se unió al hogar mediante código de invitación`,
      },
    });

    return { message: '¡Te has unido con éxito al hogar!', householdId: invitation.householdId };
  }

  async getActivityFeed(householdId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { householdId },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 30,
    });

    return logs.map((l) => ({
      id: l.id,
      userName: l.user.fullName || l.user.email.split('@')[0],
      userEmail: l.user.email,
      action: l.action,
      details: l.details,
      timestamp: l.timestamp,
    }));
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

    const updated = await this.prisma.householdMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: { user: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        householdId,
        action: 'UPDATE_ROLE',
        details: `Cambió el rol de ${updated.user.fullName || updated.user.email} a ${dto.role}`,
      },
    });

    return updated;
  }

  async updateCustomTitle(currentUserId: string, householdId: string, memberId: string, customTitle: string) {
    const memberToUpdate = await this.prisma.householdMember.findFirst({
      where: { id: memberId, householdId },
    });

    if (!memberToUpdate) {
      throw new NotFoundException('Miembro no encontrado en este hogar');
    }

    const updated = await this.prisma.householdMember.update({
      where: { id: memberId },
      data: { customTitle },
      include: { user: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        householdId,
        action: 'UPDATE_TITLE',
        details: `Asignó el título "${customTitle}" a ${updated.user.fullName || updated.user.email}`,
      },
    });

    return updated;
  }

  async removeMember(currentUserId: string, householdId: string, memberId: string) {
    const currentMember = await this.prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: currentUserId,
          householdId,
        },
      },
    });

    if (!currentMember || currentMember.role !== Role.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden eliminar integrantes');
    }

    const memberToDelete = await this.prisma.householdMember.findFirst({
      where: { id: memberId, householdId },
      include: { user: true },
    });

    if (!memberToDelete) {
      throw new NotFoundException('Miembro no encontrado en este hogar');
    }

    if (memberToDelete.userId === currentUserId) {
      throw new BadRequestException('No puedes eliminarte a ti mismo del hogar');
    }

    await this.prisma.householdMember.delete({
      where: { id: memberId },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        householdId,
        action: 'REMOVE_MEMBER',
        details: `Eliminó a ${memberToDelete.user.fullName || memberToDelete.user.email} del hogar`,
      },
    });

    return { message: 'Integrante eliminado correctamente' };
  }

  // 🤝 MÓDULO DE GASTOS COMPARTIDOS (SPLIT FAMILIAR TIPO SPLITWISE)
  async getSplitSummary(householdId: string) {
    // 1. Obtener última fecha de liquidación registrada
    const lastSettleLog = await this.prisma.auditLog.findFirst({
      where: {
        householdId,
        action: 'SETTLE_SPLIT',
      },
      orderBy: { timestamp: 'desc' },
    });

    const sinceDate = lastSettleLog ? lastSettleLog.timestamp : new Date(0);

    // 2. Miembros adultos activos del hogar
    const members = await this.prisma.householdMember.findMany({
      where: { householdId },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    // 3. Transacciones compartidas desde la última liquidación
    // Se consideran gastos que incluyan la etiqueta [🤝 o [SPLIT o [COMPARTIDO
    const transactions = await this.prisma.transaction.findMany({
      where: {
        householdId,
        type: 'EXPENSE',
        isVoided: false,
        date: { gte: sinceDate },
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        account: {
          select: { id: true, name: true, currency: true },
        },
        category: true,
      },
      orderBy: { date: 'desc' },
    });

    // Filtrar aquellas transacciones marcadas como compartidas
    const splitTxs = transactions.filter(
      (t) =>
        t.description &&
        (t.description.includes('🤝') ||
          t.description.includes('[SPLIT') ||
          t.description.includes('[COMPARTIDO') ||
          t.description.includes('Compartido')),
    );

    // 4. Calcular aportes por miembro
    const memberPayments: Record<string, number> = {};
    members.forEach((m) => {
      memberPayments[m.userId] = 0;
    });

    let totalPool = 0;
    for (const tx of splitTxs) {
      const amount = Number(tx.amount);
      const payerId = tx.createdById || members[0]?.userId;
      if (payerId && memberPayments[payerId] !== undefined) {
        memberPayments[payerId] += amount;
      } else if (members.length > 0) {
        memberPayments[members[0].userId] += amount;
      }
      totalPool += amount;
    }

    // Miembros adultos (excluyendo dependientes para el reparto de costos)
    const adultMembers = members.filter((m) => m.role !== 'DEPENDENT');
    const splitCount = adultMembers.length > 0 ? adultMembers.length : 1;
    const fairSharePerMember = totalPool / splitCount;

    // Resumen con saldo neto por integrante (+ a favor, - en deuda)
    const membersSummary = members.map((m) => {
      const paid = memberPayments[m.userId] || 0;
      const isContributing = m.role !== 'DEPENDENT';
      const fairShare = isContributing ? fairSharePerMember : 0;
      const netBalance = Math.round((paid - fairShare) * 100) / 100;

      return {
        memberId: m.id,
        userId: m.userId,
        fullName: m.user.fullName || m.user.email.split('@')[0],
        email: m.user.email,
        customTitle: m.customTitle,
        role: m.role,
        paidAmount: Math.round(paid * 100) / 100,
        fairShare: Math.round(fairShare * 100) / 100,
        netBalance, // Positivo = se le debe dinero; Negativo = debe dinero
      };
    });

    // 5. Algoritmo de resolución de deudas (Quién paga a quién para quedar en cero)
    const debtors = membersSummary
      .filter((m) => m.netBalance < -0.01)
      .map((m) => ({ ...m, amountOwed: Math.abs(m.netBalance) }));

    const creditors = membersSummary
      .filter((m) => m.netBalance > 0.01)
      .map((m) => ({ ...m, amountReceivable: m.netBalance }));

    const settlements: Array<{
      fromUserId: string;
      fromName: string;
      toUserId: string;
      toName: string;
      amount: number;
    }> = [];

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const settleAmount = Math.min(debtor.amountOwed, creditor.amountReceivable);

      if (settleAmount > 0.01) {
        settlements.push({
          fromUserId: debtor.userId,
          fromName: debtor.fullName,
          toUserId: creditor.userId,
          toName: creditor.fullName,
          amount: Math.round(settleAmount * 100) / 100,
        });
      }

      debtor.amountOwed -= settleAmount;
      creditor.amountReceivable -= settleAmount;

      if (debtor.amountOwed <= 0.01) dIdx++;
      if (creditor.amountReceivable <= 0.01) cIdx++;
    }

    return {
      totalPool: Math.round(totalPool * 100) / 100,
      fairSharePerMember: Math.round(fairSharePerMember * 100) / 100,
      lastSettledAt: lastSettleLog ? lastSettleLog.timestamp : null,
      membersSummary,
      settlements,
      splitTransactions: splitTxs.map((t) => ({
        id: t.id,
        date: t.date,
        amount: Number(t.amount),
        description: t.description?.replace(/\[🤝[^\]]+\]|\[SPLIT[^\]]+\]/g, '').trim() || t.description,
        payerName: t.createdBy?.fullName || t.createdBy?.email?.split('@')[0] || 'Miembro',
        accountName: t.account?.name,
        categoryName: t.category?.name || 'General',
        categoryIcon: t.category?.icon || '📦',
      })),
    };
  }

  async settleSplit(householdId: string, currentUserId: string, note?: string) {
    const summary = await this.getSplitSummary(householdId);

    const log = await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        householdId,
        action: 'SETTLE_SPLIT',
        details:
          note ||
          `Liquidación de gastos comunes completada. Total liquidado: $${summary.totalPool.toFixed(
            2,
          )} entre ${summary.membersSummary.length} miembros.`,
      },
    });

    return {
      success: true,
      message: 'Gastos comunes saldados correctamente. Las cuentas han quedado equilibradas a cero.',
      settledAt: log.timestamp,
    };
  }
}
