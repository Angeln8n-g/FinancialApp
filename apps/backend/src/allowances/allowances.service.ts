import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecurrencePeriod, TransactionType } from '@prisma/client';

@Injectable()
export class AllowancesService {
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
}
