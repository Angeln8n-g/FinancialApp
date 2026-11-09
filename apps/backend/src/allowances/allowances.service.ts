import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecurrencePeriod, TransactionType } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface FamilyMission {
  id: string;
  householdId: string;
  memberId: string;
  memberName: string;
  title: string;
  description?: string;
  rewardAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'APPROVED_AND_PAID';
  createdAt: string;
  completedAt?: string;
  approvedAt?: string;
}

export interface SavingsMatchingRule {
  householdId: string;
  matchPercentage: number;
  maxMonthlyBonus: number;
  active: boolean;
  totalMatchedThisMonth: number;
}

@Injectable()
export class AllowancesService {
  // In-memory persistent collections for Family Missions & Savings Matching
  private static missionsMap: Map<string, FamilyMission[]> = new Map();
  private static matchingRulesMap: Map<string, SavingsMatchingRule> = new Map();

  constructor(private prisma: PrismaService) {}

  async findAll(householdId: string) {
    const allowances = await this.prisma.allowance.findMany({
      where: { householdId },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return allowances.map((a) => {
      const limit = Number(a.limitAmount);
      const spent = Number(a.spentAmount);
      const remaining = Math.max(0, limit - spent);
      const percentageUsed = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

      return {
        ...a,
        limitAmount: limit,
        spentAmount: spent,
        remainingAmount: remaining,
        percentageUsed,
      };
    });
  }

  async create(
    householdId: string,
    data: { memberId: string; title: string; limitAmount: number; period?: RecurrencePeriod },
  ) {
    return this.prisma.allowance.create({
      data: {
        householdId,
        memberId: data.memberId,
        title: data.title,
        limitAmount: data.limitAmount,
        spentAmount: 0,
        period: data.period || RecurrencePeriod.MONTHLY,
      },
    });
  }

  async recordExpense(householdId: string, id: string, amount: number) {
    const allowance = await this.prisma.allowance.findFirst({
      where: { id, householdId },
    });
    if (!allowance) throw new NotFoundException('Mesada no encontrada');

    return this.prisma.allowance.update({
      where: { id },
      data: {
        spentAmount: { increment: amount },
      },
    });
  }

  async disburse(householdId: string, id: string, data: { accountId: string; amount?: number }) {
    const allowance = await this.prisma.allowance.findFirst({
      where: { id, householdId },
      include: { member: { include: { user: true } } },
    });
    if (!allowance) throw new NotFoundException('Mesada no encontrada');

    const account = await this.prisma.account.findFirst({
      where: { id: data.accountId, householdId },
    });
    if (!account) throw new NotFoundException('Cuenta no encontrada');

    const disburseAmount = data.amount || Number(allowance.limitAmount);

    return this.prisma.$transaction(async (tx) => {
      // 1. Crear movimiento de gasto en la cuenta del hogar
      await tx.transaction.create({
        data: {
          householdId,
          accountId: account.id,
          type: TransactionType.EXPENSE,
          amount: disburseAmount,
          description: `Desembolso Mesada: ${allowance.title} (${allowance.member.user.fullName})`,
          date: new Date(),
        },
      });

      // 2. Descontar saldo de la cuenta
      await tx.account.update({
        where: { id: account.id },
        data: { balance: { decrement: disburseAmount } },
      });

      return { success: true, message: `Desembolso de $${disburseAmount} realizado desde ${account.name}` };
    });
  }

  async reset(householdId: string, id: string) {
    const allowance = await this.prisma.allowance.findFirst({
      where: { id, householdId },
    });
    if (!allowance) throw new NotFoundException('Mesada no encontrada');

    return this.prisma.allowance.update({
      where: { id },
      data: { spentAmount: 0 },
    });
  }

  async createRequest(householdId: string, memberId: string, allowanceId: string, amount: number, reason: string) {
    const req = await this.prisma.allowanceRequest.create({
      data: {
        householdId,
        memberId,
        allowanceId,
        amount,
        reason,
        status: 'PENDING',
      },
      include: {
        member: { include: { user: true } },
      },
    });

    // Notificar a administradores del hogar
    const admins = await this.prisma.householdMember.findMany({
      where: { householdId, role: 'ADMIN' },
    });

    const requesterName = req.member.user.fullName || req.member.user.email.split('@')[0];

    for (const admin of admins) {
      await this.prisma.notification.create({
        data: {
          userId: admin.userId,
          householdId,
          title: '🙋‍♂️ Solicitud de Dinero Extra',
          body: `${requesterName} solicita $${amount} para: "${reason}"`,
          type: 'ALLOWANCE_REQUEST',
        },
      });
    }

    return req;
  }

  async getRequests(householdId: string) {
    return this.prisma.allowanceRequest.findMany({
      where: { householdId },
      include: {
        member: { include: { user: true } },
        allowance: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respondRequest(householdId: string, requestId: string, status: 'APPROVED' | 'REJECTED') {
    const req = await this.prisma.allowanceRequest.findFirst({
      where: { id: requestId, householdId },
    });
    if (!req) throw new NotFoundException('Solicitud no encontrada');

    const updated = await this.prisma.allowanceRequest.update({
      where: { id: requestId },
      data: { status },
    });

    if (status === 'APPROVED') {
      // Incrementar límite de la mesada por el monto aprobado
      await this.prisma.allowance.update({
        where: { id: req.allowanceId },
        data: { limitAmount: { increment: req.amount } },
      });
    }

    return updated;
  }

  async remove(id: string, householdId: string) {
    return this.prisma.allowance.deleteMany({
      where: { id, householdId },
    });
  }

  // --- 🏆 MISIONES Y TAREAS FAMILIARES (GAMIFICACIÓN) ---

  async getMissions(householdId: string): Promise<FamilyMission[]> {
    if (!AllowancesService.missionsMap.has(householdId)) {
      // Seed default sample missions for demonstration
      const members = await this.prisma.householdMember.findMany({
        where: { householdId },
        include: { user: true },
      });

      const sampleMember = members.find((m) => m.role === 'DEPENDENT') || members[0];
      const memberName = sampleMember ? (sampleMember.user.fullName || sampleMember.user.email) : 'Hijo / Familiar';
      const memberId = sampleMember ? sampleMember.id : 'default';

      const initialMissions: FamilyMission[] = [
        {
          id: randomUUID(),
          householdId,
          memberId,
          memberName,
          title: 'Ordenar habitación y tender la cama toda la semana',
          description: 'Mantener el orden diario antes de salir a la escuela',
          rewardAmount: 5.0,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
        {
          id: randomUUID(),
          householdId,
          memberId,
          memberName,
          title: 'Lavar el auto familiar',
          description: 'Limpiar exterior y aspirar asientos',
          rewardAmount: 8.0,
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
        {
          id: randomUUID(),
          householdId,
          memberId,
          memberName,
          title: 'Obtener calificación A en examen escolar',
          description: 'Recompensa por esfuerzo académico',
          rewardAmount: 15.0,
          status: 'APPROVED_AND_PAID',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
        },
      ];

      AllowancesService.missionsMap.set(householdId, initialMissions);
    }

    return AllowancesService.missionsMap.get(householdId) || [];
  }

  async createMission(
    householdId: string,
    data: { memberId: string; title: string; rewardAmount: number; description?: string },
  ): Promise<FamilyMission> {
    if (!data.title || data.rewardAmount <= 0) {
      throw new BadRequestException('Título y monto de recompensa positivo son requeridos');
    }

    const member = await this.prisma.householdMember.findFirst({
      where: { id: data.memberId, householdId },
      include: { user: true },
    });

    const memberName = member ? (member.user.fullName || member.user.email) : 'Hijo / Familiar';

    const newMission: FamilyMission = {
      id: randomUUID(),
      householdId,
      memberId: data.memberId,
      memberName,
      title: data.title.trim(),
      description: data.description?.trim(),
      rewardAmount: Number(data.rewardAmount.toFixed(2)),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const current = await this.getMissions(householdId);
    current.unshift(newMission);
    AllowancesService.missionsMap.set(householdId, current);

    return newMission;
  }

  async completeMission(householdId: string, missionId: string, memberId?: string): Promise<FamilyMission> {
    const missions = await this.getMissions(householdId);
    const mission = missions.find((m) => m.id === missionId);
    if (!mission) throw new NotFoundException('Misión no encontrada');

    mission.status = 'COMPLETED';
    mission.completedAt = new Date().toISOString();

    // Notificar a administradores
    const admins = await this.prisma.householdMember.findMany({
      where: { householdId, role: 'ADMIN' },
    });

    for (const admin of admins) {
      await this.prisma.notification.create({
        data: {
          userId: admin.userId,
          householdId,
          title: '🏆 Misión Familiar Completada',
          body: `${mission.memberName} completó: "${mission.title}". Toca para aprobar y desembolsar $${mission.rewardAmount.toFixed(2)}.`,
          type: 'SYSTEM',
        },
      });
    }

    return mission;
  }

  async approveAndPayMission(
    householdId: string,
    missionId: string,
    data: { accountId: string },
    parentUserId?: string,
  ): Promise<{ mission: FamilyMission; message: string }> {
    const missions = await this.getMissions(householdId);
    const mission = missions.find((m) => m.id === missionId);
    if (!mission) throw new NotFoundException('Misión no encontrada');

    const account = await this.prisma.account.findFirst({
      where: { id: data.accountId, householdId },
    });
    if (!account) throw new NotFoundException('Cuenta de desembolso no encontrada');

    // 1. Descontar recompensa de la cuenta y crear transacción
    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          householdId,
          accountId: account.id,
          type: TransactionType.EXPENSE,
          amount: mission.rewardAmount,
          description: `🏆 Recompensa Misión: ${mission.title} (${mission.memberName})`,
          date: new Date(),
          createdById: parentUserId || null,
        },
      });

      await tx.account.update({
        where: { id: account.id },
        data: { balance: { decrement: mission.rewardAmount } },
      });
    });

    mission.status = 'APPROVED_AND_PAID';
    mission.approvedAt = new Date().toISOString();

    return {
      mission,
      message: `¡Recompensa de $${mission.rewardAmount.toFixed(2)} transferida con éxito desde ${account.name}!`,
    };
  }

  async deleteMission(householdId: string, missionId: string): Promise<boolean> {
    const missions = await this.getMissions(householdId);
    const filtered = missions.filter((m) => m.id !== missionId);
    AllowancesService.missionsMap.set(householdId, filtered);
    return true;
  }

  // --- 💡 REGLAS DE MATCHING DE AHORRO FAMILIAR ---

  getSavingsMatching(householdId: string): SavingsMatchingRule {
    if (!AllowancesService.matchingRulesMap.has(householdId)) {
      AllowancesService.matchingRulesMap.set(householdId, {
        householdId,
        matchPercentage: 50, // 50% de aporte adicional de los padres
        maxMonthlyBonus: 50,  // Hasta $50 al mes
        active: true,
        totalMatchedThisMonth: 15.0,
      });
    }
    return AllowancesService.matchingRulesMap.get(householdId)!;
  }

  updateSavingsMatching(
    householdId: string,
    data: { matchPercentage: number; maxMonthlyBonus: number; active: boolean },
  ): SavingsMatchingRule {
    const current = this.getSavingsMatching(householdId);
    const updated: SavingsMatchingRule = {
      ...current,
      matchPercentage: Math.max(0, Math.min(200, data.matchPercentage)),
      maxMonthlyBonus: Math.max(0, data.maxMonthlyBonus),
      active: data.active,
    };
    AllowancesService.matchingRulesMap.set(householdId, updated);
    return updated;
  }
}
