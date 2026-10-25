import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(householdId: string) {
    const goals = await this.prisma.savingsGoal.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    return goals.map((g) => {
      const target = Number(g.targetAmount);
      const current = Number(g.currentAmount);
      const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
      const remaining = Math.max(target - current, 0);

      let suggestedMonthly = 0;
      let daysRemaining: number | null = null;

      if (g.targetDate) {
        const targetD = new Date(g.targetDate);
        const timeDiff = targetD.getTime() - now.getTime();
        daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

        const monthsDiff = Math.max(
          (targetD.getFullYear() - now.getFullYear()) * 12 + (targetD.getMonth() - now.getMonth()),
          1,
        );
        suggestedMonthly = remaining > 0 ? Math.round(remaining / monthsDiff) : 0;
      }

      return {
        id: g.id,
        name: g.name,
        targetAmount: target,
        currentAmount: current,
        remainingAmount: remaining,
        targetDate: g.targetDate,
        daysRemaining,
        percentage,
        isCompleted: current >= target,
        suggestedMonthly,
      };
    });
  }

  async create(householdId: string, data: { name: string; targetAmount: number; currentAmount?: number; targetDate?: string }) {
    if (data.targetAmount <= 0) {
      throw new BadRequestException('El monto objetivo debe ser mayor a cero');
    }

    return this.prisma.savingsGoal.create({
      data: {
        householdId,
        name: data.name,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount || 0,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
      },
    });
  }

  async update(
    householdId: string,
    goalId: string,
    data: { name?: string; targetAmount?: number; targetDate?: string },
  ) {
    const goal = await this.prisma.savingsGoal.findFirst({
      where: { id: goalId, householdId },
    });

    if (!goal) {
      throw new NotFoundException('Meta de ahorro no encontrada');
    }

    return this.prisma.savingsGoal.update({
      where: { id: goalId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
        ...(data.targetDate !== undefined && { targetDate: data.targetDate ? new Date(data.targetDate) : null }),
      },
    });
  }

  async contribute(
    householdId: string,
    goalId: string,
    data: { amount: number; accountId?: string; notes?: string },
    currentUserId?: string,
  ) {
    const { amount, accountId, notes } = data;
    if (amount <= 0) {
      throw new BadRequestException('El monto a aportar debe ser mayor a cero');
    }

    const goal = await this.prisma.savingsGoal.findFirst({
      where: { id: goalId, householdId },
    });

    if (!goal) {
      throw new NotFoundException('Meta de ahorro no encontrada');
    }

    return this.prisma.$transaction(async (tx) => {
      // Si se especificó una cuenta de origen, debitar saldo y crear movimiento
      if (accountId) {
        const account = await tx.account.findFirst({
          where: { id: accountId, householdId },
        });

        if (!account) {
          throw new NotFoundException('Cuenta de origen no encontrada');
        }

        // Crear transacción de gasto de ahorro
        await tx.transaction.create({
          data: {
            householdId,
            accountId,
            type: TransactionType.EXPENSE,
            amount,
            description: notes || `Aporte a meta: ${goal.name}`,
            date: new Date(),
            createdById: currentUserId || null,
          },
        });

        // Descontar saldo de la cuenta
        await tx.account.update({
          where: { id: accountId },
          data: {
            balance: { decrement: amount },
          },
        });
      }

      // Incrementar el monto actual de la meta
      const updatedGoal = await tx.savingsGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: { increment: amount },
        },
      });

      return updatedGoal;
    });
  }

  async delete(householdId: string, goalId: string) {
    return this.prisma.savingsGoal.deleteMany({
      where: { id: goalId, householdId },
    });
  }
}
