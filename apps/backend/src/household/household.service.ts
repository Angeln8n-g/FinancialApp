import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChildAccountDto, InviteMemberDto, UpdateParentalControlDto, UpdateRoleDto } from './household.dto';
import { RecurrencePeriod, Role, TransactionType } from '@prisma/client';
import { ParentalControlHelper } from './parental-control.helper';
import * as crypto from 'crypto';

@Injectable()
export class HouseholdService {
  constructor(private prisma: PrismaService) {}

  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const iterations = 100000;
    const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    return `pbkdf2$${iterations}$${salt}$${hash}`;
  }

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

    const parentalConfigs = await ParentalControlHelper.getHouseholdParentalControls(this.prisma, householdId);

    return members.map(m => {
      const childCfg = m.role === Role.DEPENDENT
        ? parentalConfigs.find(c => c.childUserId === m.userId)
        : null;

      return {
        id: m.id,
        userId: m.userId,
        email: m.user.email,
        fullName: m.user.fullName,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        customTitle: m.customTitle,
        joinedAt: m.joinedAt,
        isChildAccount: m.role === Role.DEPENDENT,
        parentEmail: childCfg?.parentEmail || null,
        childAccountId: childCfg?.childAccountId || null,
        parentalControls: childCfg || null,
      };
    });
  }

  async inviteMember(currentUserId: string, householdId: string, dto: InviteMemberDto) {
    const currentMember = await this.prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: currentUserId,
          householdId,
        },
      },
      include: { user: true },
    });

    if (!currentMember || currentMember.role !== Role.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden invitar nuevos miembros');
    }

    const code = 'HIQ-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    let targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (!targetUser) {
      targetUser = await this.prisma.user.create({
        data: {
          email: dto.email.trim().toLowerCase(),
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

    const isChild = dto.role === Role.DEPENDENT;
    const parentEmailForChild = (dto.parentEmail || currentMember.user.email).trim().toLowerCase();

    const member = await this.prisma.householdMember.create({
      data: {
        userId: targetUser.id,
        householdId,
        role: dto.role || Role.COLLABORATOR,
        customTitle: isChild ? `👦 Cuenta Infantil (Tutor: ${parentEmailForChild})` : undefined,
      },
      include: { user: true },
    });

    if (isChild) {
      await ParentalControlHelper.ensureChildSetup(this.prisma, {
        householdId,
        childUserId: targetUser.id,
        childEmail: targetUser.email,
        childName: targetUser.fullName || targetUser.email.split('@')[0],
        memberId: member.id,
        parentEmail: parentEmailForChild,
        parentUserId: currentUserId,
      });
    }

    await this.prisma.householdInvitation.create({
      data: {
        householdId,
        email: dto.email.trim().toLowerCase(),
        role: dto.role || Role.COLLABORATOR,
        code,
        expiresAt,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        householdId,
        action: 'INVITE_MEMBER',
        details: isChild
          ? `Creó y enlazó cuenta de niño para ${dto.email} bajo control parental de ${parentEmailForChild} (Código: ${code})`
          : `Invitó a ${dto.email} como ${dto.role || Role.COLLABORATOR} (Código: ${code})`,
      },
    });

    return {
      member,
      invitationCode: code,
      inviteLink: `http://localhost:3001/invite/${code}`,
    };
  }

  // 🛡️ MÓDULO DE CUENTAS DE NIÑOS & CONTROL PARENTAL

  async getParentalControls(householdId: string, requestingUserId?: string) {
    const configs = await ParentalControlHelper.getHouseholdParentalControls(this.prisma, householdId);

    const accounts = await this.prisma.account.findMany({
      where: { householdId },
    });

    const allowances = await this.prisma.allowance.findMany({
      where: { householdId },
    });

    const requests = await this.prisma.allowanceRequest.findMany({
      where: { householdId, status: 'PENDING' },
    });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayExpenses = await this.prisma.transaction.findMany({
      where: {
        householdId,
        type: TransactionType.EXPENSE,
        isVoided: false,
        date: { gte: startOfDay },
      },
    });

    // Si quien consulta es un niño (DEPENDENT), solo retornar su propia configuración
    const callerConfig = requestingUserId
      ? await ParentalControlHelper.getChildConfigIfDependent(this.prisma, householdId, requestingUserId)
      : null;

    const filteredConfigs = callerConfig
      ? configs.filter((c) => c.childUserId === requestingUserId)
      : configs;

    return filteredConfigs.map((cfg) => {
      const account = accounts.find(
        (a) =>
          a.id === cfg.childAccountId ||
          a.name.toLowerCase().includes(cfg.childEmail.toLowerCase()),
      );

      const allowance = allowances.find((al) => al.memberId === cfg.memberId);
      const pendingReqs = requests.filter((r) => r.memberId === cfg.memberId);

      const todaySpent = todayExpenses
        .filter((t) => (account && t.accountId === account.id) || t.createdById === cfg.childUserId)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        ...cfg,
        account: account
          ? {
              id: account.id,
              name: account.name,
              balance: Number(account.balance),
              currency: account.currency,
            }
          : null,
        allowance: allowance
          ? {
              id: allowance.id,
              title: allowance.title,
              limitAmount: Number(allowance.limitAmount),
              spentAmount: Number(allowance.spentAmount),
              remainingAmount: Math.max(0, Number(allowance.limitAmount) - Number(allowance.spentAmount)),
              period: allowance.period,
            }
          : null,
        todaySpent: Math.round(todaySpent * 100) / 100,
        pendingRequestsCount: pendingReqs.length,
      };
    });
  }

  async createChildAccount(currentUserId: string, householdId: string, dto: CreateChildAccountDto) {
    const currentMember = await this.prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: currentUserId,
          householdId,
        },
      },
      include: { user: true },
    });

    if (!currentMember || currentMember.role === Role.DEPENDENT) {
      throw new ForbiddenException('Solo un padre o administrador puede crear y enlazar cuentas de niños.');
    }

    const cleanChildEmail = dto.childEmail.trim().toLowerCase();
    const cleanParentEmail = (dto.parentEmail || currentMember.user.email).trim().toLowerCase();
    const cleanChildName = dto.childName.trim();

    if (cleanChildEmail === cleanParentEmail) {
      throw new BadRequestException('El correo del niño debe ser distinto al correo del padre o tutor.');
    }

    const passwordHash = this.hashPassword(dto.childPassword || '123456');

    // 1. Asegurar padre/tutor enlazado al hogar
    let parentUser = await this.prisma.user.findUnique({
      where: { email: cleanParentEmail },
    });

    if (!parentUser) {
      parentUser = await this.prisma.user.create({
        data: {
          email: cleanParentEmail,
          fullName: cleanParentEmail.split('@')[0],
        },
      });
    }

    const parentMembership = await this.prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: parentUser.id,
          householdId,
        },
      },
    });

    if (!parentMembership) {
      await this.prisma.householdMember.create({
        data: {
          userId: parentUser.id,
          householdId,
          role: Role.ADMIN,
          customTitle: '👨‍👩‍👧 Padre / Tutor (Control Parental)',
        },
      });
    }

    // 2. Crear o actualizar usuario del niño
    let childUser = await this.prisma.user.findUnique({
      where: { email: cleanChildEmail },
    });

    if (!childUser) {
      childUser = await this.prisma.user.create({
        data: {
          email: cleanChildEmail,
          fullName: cleanChildName,
          passwordHash,
        },
      });
    } else {
      childUser = await this.prisma.user.update({
        where: { id: childUser.id },
        data: {
          fullName: cleanChildName || childUser.fullName,
          ...(dto.childPassword || !childUser.passwordHash ? { passwordHash } : {}),
        },
      });
    }

    // 3. Crear o actualizar membresía DEPENDENT en el hogar
    const customTitle = `👦 Cuenta Infantil (Tutor: ${cleanParentEmail})`;
    let childMember = await this.prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: childUser.id,
          householdId,
        },
      },
    });

    if (!childMember) {
      childMember = await this.prisma.householdMember.create({
        data: {
          userId: childUser.id,
          householdId,
          role: Role.DEPENDENT,
          customTitle,
        },
      });
    } else {
      childMember = await this.prisma.householdMember.update({
        where: { id: childMember.id },
        data: {
          role: Role.DEPENDENT,
          customTitle,
        },
      });
    }

    // 4. Configurar cuenta financiera infantil, mesada y control parental
    const { config, account } = await ParentalControlHelper.ensureChildSetup(this.prisma, {
      householdId,
      childUserId: childUser.id,
      childEmail: cleanChildEmail,
      childName: cleanChildName,
      memberId: childMember.id,
      parentEmail: cleanParentEmail,
      parentUserId: parentUser.id,
      initialBalance: dto.initialBalance ?? 0,
      maxDailySpend: dto.maxDailySpend ?? 25,
      maxSingleTransaction: dto.maxSingleTransaction ?? 15,
      requireApprovalAbove: dto.requireApprovalAbove ?? 10,
      allowanceAmount: dto.allowanceAmount ?? 50,
      allowancePeriod: dto.allowancePeriod || RecurrencePeriod.WEEKLY,
    });

    // Si se especificó saldo inicial y la cuenta ya existía con 0, ajustar balance
    if (dto.initialBalance && dto.initialBalance > 0 && account && Number(account.balance) === 0) {
      await this.prisma.account.update({
        where: { id: account.id },
        data: { balance: dto.initialBalance },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        householdId,
        action: 'CREATE_CHILD_ACCOUNT',
        details: `Creó cuenta de niño para ${cleanChildName} (${cleanChildEmail}) enlazada automáticamente al control parental de ${cleanParentEmail}`,
      },
    });

    return {
      message: `Cuenta de niño creada para ${cleanChildName} y enlazada al control parental de ${cleanParentEmail}.`,
      config,
      account,
    };
  }

  async updateParentalControl(
    currentUserId: string,
    householdId: string,
    childUserId: string,
    dto: UpdateParentalControlDto,
  ) {
    const currentMember = await this.prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: currentUserId,
          householdId,
        },
      },
    });

    if (!currentMember || currentMember.role === Role.DEPENDENT) {
      throw new ForbiddenException('Solo los padres o administradores pueden modificar el control parental.');
    }

    const configs = await ParentalControlHelper.getHouseholdParentalControls(this.prisma, householdId);
    const existing = configs.find((c) => c.childUserId === childUserId);

    if (!existing) {
      throw new NotFoundException('Configuración de cuenta de niño no encontrada en este hogar.');
    }

    const updatedParentEmail = dto.parentEmail ? dto.parentEmail.trim().toLowerCase() : existing.parentEmail;

    const updatedConfig = await ParentalControlHelper.saveConfig(
      this.prisma,
      {
        ...existing,
        parentEmail: updatedParentEmail,
        maxDailySpend: dto.maxDailySpend !== undefined ? Number(dto.maxDailySpend) : existing.maxDailySpend,
        maxSingleTransaction:
          dto.maxSingleTransaction !== undefined ? Number(dto.maxSingleTransaction) : existing.maxSingleTransaction,
        requireApprovalAbove:
          dto.requireApprovalAbove !== undefined ? Number(dto.requireApprovalAbove) : existing.requireApprovalAbove,
        isFrozen: dto.isFrozen !== undefined ? Boolean(dto.isFrozen) : existing.isFrozen,
        allowSavingsGoals:
          dto.allowSavingsGoals !== undefined ? Boolean(dto.allowSavingsGoals) : existing.allowSavingsGoals,
        blockedCategories: dto.blockedCategories !== undefined ? dto.blockedCategories : existing.blockedCategories,
      },
      currentUserId,
    );

    if (dto.parentEmail && existing.memberId) {
      await this.prisma.householdMember.update({
        where: { id: existing.memberId },
        data: { customTitle: `👦 Cuenta Infantil (Tutor: ${updatedParentEmail})` },
      });
    }

    // Notificar al niño si se congeló/descongeló o actualizaron sus límites
    await this.prisma.notification.create({
      data: {
        userId: childUserId,
        householdId,
        title: updatedConfig.isFrozen ? '🔒 Cuenta Infantil Pausada' : '🛡️ Control Parental Actualizado',
        body: updatedConfig.isFrozen
          ? `Tu padre/tutor (${updatedConfig.parentEmail}) ha pausado temporalmente los gastos de tu cuenta.`
          : `Tu padre/tutor (${updatedConfig.parentEmail}) actualizó tus reglas: Límite por compra $${updatedConfig.maxSingleTransaction.toFixed(2)}, Límite diario $${updatedConfig.maxDailySpend.toFixed(2)}.`,
        type: 'PARENTAL_CONTROL',
      },
    });

    return updatedConfig;
  }

  async topUpChildAccount(
    currentUserId: string,
    householdId: string,
    childUserId: string,
    body: { fromAccountId: string; amount: number; note?: string },
  ) {
    const currentMember = await this.prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: currentUserId,
          householdId,
        },
      },
      include: { user: true },
    });

    if (!currentMember || currentMember.role === Role.DEPENDENT) {
      throw new ForbiddenException('Solo un padre o administrador puede recargar saldo a una cuenta de niño.');
    }

    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      throw new BadRequestException('El monto de recarga debe ser mayor a cero.');
    }

    const configs = await ParentalControlHelper.getHouseholdParentalControls(this.prisma, householdId);
    const childCfg = configs.find((c) => c.childUserId === childUserId);
    if (!childCfg || !childCfg.childAccountId) {
      throw new NotFoundException('Cuenta de niño no encontrada.');
    }

    const fromAccount = await this.prisma.account.findFirst({
      where: { id: body.fromAccountId, householdId },
    });
    if (!fromAccount) {
      throw new NotFoundException('Cuenta de origen no encontrada.');
    }

    const childAccount = await this.prisma.account.findFirst({
      where: { id: childCfg.childAccountId, householdId },
    });
    if (!childAccount) {
      throw new NotFoundException('Cuenta financiera del niño no encontrada.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          householdId,
          accountId: fromAccount.id,
          destinationAccountId: childAccount.id,
          createdById: currentUserId,
          type: TransactionType.TRANSFER,
          amount,
          description: body.note || `💝 Recarga Control Parental para ${childCfg.childName}`,
          date: new Date(),
        },
      });

      await tx.account.update({
        where: { id: fromAccount.id },
        data: { balance: { decrement: amount } },
      });

      await tx.account.update({
        where: { id: childAccount.id },
        data: { balance: { increment: amount } },
      });

      await tx.notification.create({
        data: {
          userId: childUserId,
          householdId,
          title: '🎉 ¡Recibiste Dinero en tu Cuenta!',
          body: `${currentMember.user.fullName || currentMember.user.email} te envió $${amount.toFixed(2)} a tu cuenta de niño.`,
          type: 'PARENTAL_CONTROL',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          householdId,
          action: 'TOPUP_CHILD_ACCOUNT',
          details: `Transfirió $${amount.toFixed(2)} desde ${fromAccount.name} a la cuenta de niño de ${childCfg.childName}`,
        },
      });
    });

    return {
      success: true,
      message: `Se transfirieron $${amount.toFixed(2)} exitosamente a la cuenta de ${childCfg.childName}.`,
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
      where: {
        householdId,
        action: { not: 'PARENTAL_CONTROL_CONFIG' },
      },
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
      include: { user: true },
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
      data: {
        role: dto.role,
        ...(dto.role === Role.DEPENDENT
          ? { customTitle: `👦 Cuenta Infantil (Tutor: ${currentMember.user.email})` }
          : {}),
      },
      include: { user: true },
    });

    if (dto.role === Role.DEPENDENT) {
      await ParentalControlHelper.ensureChildSetup(this.prisma, {
        householdId,
        childUserId: updated.userId,
        childEmail: updated.user.email,
        childName: updated.user.fullName || updated.user.email.split('@')[0],
        memberId: updated.id,
        parentEmail: currentMember.user.email,
        parentUserId: currentUserId,
      });
    }

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
    const lastSettleLog = await this.prisma.auditLog.findFirst({
      where: {
        householdId,
        action: 'SETTLE_SPLIT',
      },
      orderBy: { timestamp: 'desc' },
    });

    const sinceDate = lastSettleLog ? lastSettleLog.timestamp : new Date(0);

    const members = await this.prisma.householdMember.findMany({
      where: { householdId },
      include: {
        user: {
          select: { id: true, email: true, fullName: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

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

    const splitTxs = transactions.filter(
      (t) =>
        t.description &&
        (t.description.includes('🤝') ||
          t.description.includes('[SPLIT') ||
          t.description.includes('[COMPARTIDO') ||
          t.description.includes('Compartido')),
    );

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

    const adultMembers = members.filter((m) => m.role !== 'DEPENDENT');
    const splitCount = adultMembers.length > 0 ? adultMembers.length : 1;
    const fairSharePerMember = totalPool / splitCount;

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
        netBalance,
      };
    });

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
