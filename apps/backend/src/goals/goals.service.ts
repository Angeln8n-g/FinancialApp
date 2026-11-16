import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { ParentalControlHelper } from '../household/parental-control.helper';
import { Role, TransactionType } from '@prisma/client';

export interface GoalDepositRecord {
  id: string;
  goalId: string;
  childUserId?: string;
  actorUserId: string;
  actorName: string;
  depositSource: 'CHILD_BALANCE' | 'PARENT_DIRECT' | 'ADULT_CONTRIBUTION';
  amount: number;
  note?: string;
  createdAt: string;
}

interface GoalOwnershipMeta {
  goalId: string;
  childUserId: string;
  childName?: string;
  emoji?: string;
}

@Injectable()
export class GoalsService {
  constructor(
    private prisma: PrismaService,
    @Optional() private eventsGateway?: EventsGateway,
  ) {}

  private async loadGoalMetadata(householdId: string): Promise<{
    ownershipByGoalId: Map<string, GoalOwnershipMeta>;
    depositsByGoalId: Map<string, GoalDepositRecord[]>;
  }> {
    const ownershipByGoalId = new Map<string, GoalOwnershipMeta>();
    const depositsByGoalId = new Map<string, GoalDepositRecord[]>();

    if (!this.prisma.auditLog?.findMany) {
      return { ownershipByGoalId, depositsByGoalId };
    }

    try {
      const logs = await this.prisma.auditLog.findMany({
        where: {
          householdId,
          action: { in: ['GOAL_OWNERSHIP_META', 'GOAL_DEPOSIT_LOG'] },
        },
        orderBy: { timestamp: 'asc' },
      });

      for (const log of logs) {
        if (!log.details) continue;
        try {
          const parsed = JSON.parse(log.details);
          if (log.action === 'GOAL_OWNERSHIP_META' && parsed?.goalId && parsed?.childUserId) {
            ownershipByGoalId.set(parsed.goalId, parsed as GoalOwnershipMeta);
          } else if (log.action === 'GOAL_DEPOSIT_LOG' && parsed?.goalId) {
            const list = depositsByGoalId.get(parsed.goalId) || [];
            list.push({
              id: log.id,
              goalId: parsed.goalId,
              childUserId: parsed.childUserId,
              actorUserId: parsed.actorUserId || log.userId,
              actorName: parsed.actorName || 'Familiar',
              depositSource: parsed.depositSource || 'CHILD_BALANCE',
              amount: Number(parsed.amount || 0),
              note: parsed.note,
              createdAt: parsed.createdAt || log.timestamp?.toISOString?.() || new Date().toISOString(),
            });
            depositsByGoalId.set(parsed.goalId, list);
          }
        } catch {
          // Ignore malformed audit entries
        }
      }
    } catch {
      // Ignore if auditLog is unavailable in unit tests
    }

    return { ownershipByGoalId, depositsByGoalId };
  }

  private enrichGoal(
    g: any,
    ownershipByGoalId: Map<string, GoalOwnershipMeta>,
    depositsByGoalId: Map<string, GoalDepositRecord[]>,
  ) {
    const now = new Date();
    const target = Number(g.targetAmount);
    const current = Number(g.currentAmount);
    const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
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

    const meta = ownershipByGoalId.get(g.id);
    const deposits = [...(depositsByGoalId.get(g.id) || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const childSavedTotal = deposits
      .filter((d) => d.depositSource === 'CHILD_BALANCE')
      .reduce((acc, d) => acc + d.amount, 0);
    const parentDepositedTotal = deposits
      .filter((d) => d.depositSource === 'PARENT_DIRECT')
      .reduce((acc, d) => acc + d.amount, 0);

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
      isChildGoal: Boolean(meta?.childUserId),
      childUserId: meta?.childUserId || null,
      childName: meta?.childName || null,
      emoji: meta?.emoji || '🐷',
      childSavedTotal: Math.round(childSavedTotal * 100) / 100,
      parentDepositedTotal: Math.round(parentDepositedTotal * 100) / 100,
      recentDeposits: deposits.slice(0, 10),
    };
  }

  async findAll(householdId: string, userId?: string, childUserIdFilter?: string) {
    const childConfig = userId
      ? await ParentalControlHelper.getChildConfigIfDependent(this.prisma, householdId, userId)
      : null;

    const [goals, { ownershipByGoalId, depositsByGoalId }] = await Promise.all([
      this.prisma.savingsGoal.findMany({
        where: { householdId },
        orderBy: { createdAt: 'desc' },
      }),
      this.loadGoalMetadata(householdId),
    ]);

    const filtered = goals.filter((g) => {
      const meta = ownershipByGoalId.get(g.id);
      if (childConfig) {
        return meta?.childUserId === childConfig.childUserId;
      }
      if (childUserIdFilter) {
        return meta?.childUserId === childUserIdFilter;
      }
      return true;
    });

    return filtered.map((g) => this.enrichGoal(g, ownershipByGoalId, depositsByGoalId));
  }

  async getPiggyBankSummary(householdId: string, userId: string, requestedChildUserId?: string) {
    const configs = await ParentalControlHelper.getHouseholdParentalControls(this.prisma, householdId);
    const callerChild = configs.find((c) => c.childUserId === userId) || null;
    const allGoals = await this.findAll(householdId, userId);

    const accounts = await this.prisma.account.findMany({
      where: { householdId },
    });

    if (callerChild) {
      const childAccount = accounts.find((a) => a.id === callerChild.childAccountId);
      const totalSaved = allGoals.reduce((acc, g) => acc + Number(g.currentAmount || 0), 0);
      const totalTarget = allGoals.reduce((acc, g) => acc + Number(g.targetAmount || 0), 0);
      const recentDeposits = allGoals
        .flatMap((g) => (g.recentDeposits || []).map((d: any) => ({ ...d, goalName: g.name, emoji: g.emoji })))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 15);

      return {
        isChildAccount: true,
        childUserId: callerChild.childUserId,
        childName: callerChild.childName,
        childAccountId: callerChild.childAccountId,
        spendableBalance: Number(childAccount?.balance || 0),
        currency: childAccount?.currency || 'USD',
        totalSavedInPiggyBank: Math.round(totalSaved * 100) / 100,
        totalTargetAmount: Math.round(totalTarget * 100) / 100,
        allowSavingsGoals: callerChild.allowSavingsGoals,
        isFrozen: callerChild.isFrozen,
        goals: allGoals,
        recentDeposits,
      };
    }

    const targetConfigs = requestedChildUserId
      ? configs.filter((c) => c.childUserId === requestedChildUserId)
      : configs;

    const childrenPiggyBanks = targetConfigs.map((cfg) => {
      const childGoals = allGoals.filter((g) => g.childUserId === cfg.childUserId);
      const childAccount = accounts.find((a) => a.id === cfg.childAccountId);
      const totalSaved = childGoals.reduce((acc, g) => acc + Number(g.currentAmount || 0), 0);
      const totalTarget = childGoals.reduce((acc, g) => acc + Number(g.targetAmount || 0), 0);

      return {
        childUserId: cfg.childUserId,
        childName: cfg.childName,
        childAccountId: cfg.childAccountId,
        spendableBalance: Number(childAccount?.balance || 0),
        totalSavedInPiggyBank: Math.round(totalSaved * 100) / 100,
        totalTargetAmount: Math.round(totalTarget * 100) / 100,
        goalsCount: childGoals.length,
        goals: childGoals,
      };
    });

    return {
      isChildAccount: false,
      childrenPiggyBanks,
    };
  }

  async create(
    householdId: string,
    data: {
      name: string;
      targetAmount: number;
      currentAmount?: number;
      targetDate?: string;
      emoji?: string;
      childUserId?: string;
    },
    userId?: string,
  ) {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException('El nombre del objetivo es obligatorio');
    }
    if (!data.targetAmount || data.targetAmount <= 0) {
      throw new BadRequestException('El monto objetivo debe ser mayor a cero');
    }

    const childConfig = userId
      ? await ParentalControlHelper.getChildConfigIfDependent(this.prisma, householdId, userId)
      : null;

    if (childConfig && !childConfig.allowSavingsGoals) {
      throw new ForbiddenException('Tu tutor desactivó temporalmente la creación de nuevas metas de ahorro.');
    }

    let ownerChildUserId = childConfig ? childConfig.childUserId : data.childUserId || null;
    let ownerChildName = childConfig?.childName || undefined;

    if (ownerChildUserId && !ownerChildName) {
      const configs = await ParentalControlHelper.getHouseholdParentalControls(this.prisma, householdId);
      const found = configs.find((c) => c.childUserId === ownerChildUserId);
      if (!found) {
        throw new NotFoundException('Cuenta de niño no encontrada para asociar la meta');
      }
      ownerChildName = found.childName;
    }

    const created = await this.prisma.savingsGoal.create({
      data: {
        householdId,
        name: data.name.trim(),
        targetAmount: data.targetAmount,
        currentAmount: ownerChildUserId ? 0 : data.currentAmount || 0,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
      },
    });

    if (ownerChildUserId && this.prisma.auditLog?.create) {
      await this.prisma.auditLog.create({
        data: {
          userId: userId || ownerChildUserId,
          householdId,
          action: 'GOAL_OWNERSHIP_META',
          details: JSON.stringify({
            goalId: created.id,
            childUserId: ownerChildUserId,
            childName: ownerChildName,
            emoji: data.emoji || '🐷',
          }),
        },
      });
    }

    this.eventsGateway?.notifyHouseholdChange(householdId, 'goal', 'CREATE');
    return created;
  }

  async update(
    householdId: string,
    goalId: string,
    data: { name?: string; targetAmount?: number; targetDate?: string },
    userId?: string,
  ) {
    const goal = await this.prisma.savingsGoal.findFirst({
      where: { id: goalId, householdId },
    });

    if (!goal) {
      throw new NotFoundException('Meta de ahorro no encontrada');
    }

    const childConfig = userId
      ? await ParentalControlHelper.getChildConfigIfDependent(this.prisma, householdId, userId)
      : null;
    if (childConfig) {
      const { ownershipByGoalId } = await this.loadGoalMetadata(householdId);
      if (ownershipByGoalId.get(goalId)?.childUserId !== childConfig.childUserId) {
        throw new ForbiddenException('Solo puedes editar tus propios objetivos de ahorro.');
      }
    }

    const updated = await this.prisma.savingsGoal.update({
      where: { id: goalId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
        ...(data.targetDate !== undefined && { targetDate: data.targetDate ? new Date(data.targetDate) : null }),
      },
    });

    this.eventsGateway?.notifyHouseholdChange(householdId, 'goal', 'UPDATE');
    return updated;
  }

  async contribute(
    householdId: string,
    goalId: string,
    data: { amount: number; accountId?: string; notes?: string },
    currentUserId?: string,
  ) {
    const { amount, accountId, notes } = data;
    if (!amount || amount <= 0) {
      throw new BadRequestException('El monto a aportar debe ser mayor a cero');
    }

    const goal = await this.prisma.savingsGoal.findFirst({
      where: { id: goalId, householdId },
    });

    if (!goal) {
      throw new NotFoundException('Meta de ahorro no encontrada');
    }

    const childConfig = currentUserId
      ? await ParentalControlHelper.getChildConfigIfDependent(this.prisma, householdId, currentUserId)
      : null;

    if (childConfig) {
      if (childConfig.isFrozen) {
        throw new BadRequestException(
          `🔒 Tu cuenta está pausada temporalmente por control parental (${childConfig.parentEmail}).`,
        );
      }
      const { ownershipByGoalId } = await this.loadGoalMetadata(householdId);
      if (ownershipByGoalId.get(goalId)?.childUserId !== childConfig.childUserId) {
        throw new ForbiddenException('Solo puedes ahorrar en tus propias metas de alcancía.');
      }
    }

    const effectiveAccountId = childConfig ? accountId || childConfig.childAccountId : accountId;

    if (childConfig && effectiveAccountId !== childConfig.childAccountId) {
      throw new ForbiddenException('Solo puedes transferir dinero desde tu propia cuenta de niño.');
    }

    const updatedGoal = await this.prisma.$transaction(async (tx) => {
      if (effectiveAccountId) {
        const account = await tx.account.findFirst({
          where: { id: effectiveAccountId, householdId },
        });

        if (!account) {
          throw new NotFoundException('Cuenta de origen no encontrada');
        }

        if (childConfig && Number(account.balance) < amount) {
          throw new BadRequestException(
            `No tienes suficiente dinero disponible ($${Number(account.balance).toFixed(2)}) para guardar $${amount.toFixed(2)} en tu alcancía.`,
          );
        }

        await tx.transaction.create({
          data: {
            householdId,
            accountId: effectiveAccountId,
            type: childConfig ? TransactionType.TRANSFER : TransactionType.EXPENSE,
            amount,
            description:
              notes ||
              (childConfig
                ? `🐷 Ahorro a tu alcancía: ${goal.name}`
                : `Aporte a meta: ${goal.name}`),
            date: new Date(),
            createdById: currentUserId || null,
          },
        });

        await tx.account.update({
          where: { id: effectiveAccountId },
          data: {
            balance: { decrement: amount },
          },
        });
      }

      const savedGoal = await tx.savingsGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: { increment: amount },
        },
      });

      if (childConfig && tx.auditLog?.create) {
        await tx.auditLog.create({
          data: {
            userId: currentUserId || childConfig.childUserId,
            householdId,
            action: 'GOAL_DEPOSIT_LOG',
            details: JSON.stringify({
              goalId: goal.id,
              childUserId: childConfig.childUserId,
              actorUserId: childConfig.childUserId,
              actorName: childConfig.childName,
              depositSource: 'CHILD_BALANCE',
              amount,
              note: notes || `Ahorraste en "${goal.name}"`,
              createdAt: new Date().toISOString(),
            }),
          },
        });

        if (tx.householdMember?.findMany && tx.notification?.create) {
          const admins = await tx.householdMember.findMany({
            where: { householdId, role: { in: [Role.ADMIN, Role.COLLABORATOR] } },
          });
          for (const admin of admins) {
            await tx.notification.create({
              data: {
                userId: admin.userId,
                householdId,
                title: '🐷 ¡Nuevo Ahorro Infantil!',
                body: `${childConfig.childName} guardó $${amount.toFixed(2)} en su objetivo "${goal.name}".`,
                type: 'SAVINGS_GOAL_DEPOSIT',
              },
            });
          }
        }
      }

      return savedGoal;
    });

    this.eventsGateway?.notifyHouseholdChange(householdId, 'goal', 'UPDATE');
    if (effectiveAccountId) {
      this.eventsGateway?.notifyHouseholdChange(householdId, 'transaction', 'CREATE');
      this.eventsGateway?.notifyHouseholdChange(householdId, 'account', 'UPDATE');
    }
    if (childConfig) {
      this.eventsGateway?.notifyHouseholdChange(householdId, 'notification', 'CREATE');
    }

    return updatedGoal;
  }

  async parentDirectDeposit(
    householdId: string,
    parentUserId: string,
    body: {
      childUserId: string;
      fromAccountId: string;
      amount: number;
      goalId?: string;
      newGoalName?: string;
      targetAmount?: number;
      emoji?: string;
      note?: string;
    },
  ) {
    const parentMember = await this.prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: parentUserId,
          householdId,
        },
      },
      include: { user: true },
    });

    if (!parentMember || parentMember.role === Role.DEPENDENT) {
      throw new ForbiddenException('Solo un padre o administrador puede hacer abonos directos al ahorro de un niño.');
    }

    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      throw new BadRequestException('El monto del abono debe ser mayor a cero.');
    }

    const configs = await ParentalControlHelper.getHouseholdParentalControls(this.prisma, householdId);
    const childCfg = configs.find((c) => c.childUserId === body.childUserId);
    if (!childCfg) {
      throw new NotFoundException('Cuenta de niño no encontrada en el hogar.');
    }

    const fromAccount = await this.prisma.account.findFirst({
      where: { id: body.fromAccountId, householdId },
    });
    if (!fromAccount) {
      throw new NotFoundException('Cuenta de origen no encontrada.');
    }
    if (fromAccount.id === childCfg.childAccountId) {
      throw new BadRequestException('Selecciona una cuenta de adulto para abonar a la alcancía del niño.');
    }
    if (Number(fromAccount.balance) < amount) {
      throw new BadRequestException(
        `Saldo insuficiente en ${fromAccount.name} (Disponible: $${Number(fromAccount.balance).toFixed(2)}).`,
      );
    }

    const { ownershipByGoalId } = await this.loadGoalMetadata(householdId);
    let targetGoal: any = null;

    if (body.goalId) {
      targetGoal = await this.prisma.savingsGoal.findFirst({
        where: { id: body.goalId, householdId },
      });
      if (!targetGoal) {
        throw new NotFoundException('Objetivo de ahorro del niño no encontrado.');
      }
      const ownerMeta = ownershipByGoalId.get(targetGoal.id);
      if (ownerMeta && ownerMeta.childUserId !== childCfg.childUserId) {
        throw new ForbiddenException('Ese objetivo pertenece a otro integrante del hogar.');
      }
    } else {
      const existingChildGoalIds = Array.from(ownershipByGoalId.values())
        .filter((m) => m.childUserId === childCfg.childUserId)
        .map((m) => m.goalId);

      if (existingChildGoalIds.length > 0) {
        targetGoal = await this.prisma.savingsGoal.findFirst({
          where: { householdId, id: { in: existingChildGoalIds } },
          orderBy: { createdAt: 'asc' },
        });
      }
    }

    const parentDisplayName = parentMember.user?.fullName || parentMember.user?.email || 'Tu tutor';

    const result = await this.prisma.$transaction(async (tx) => {
      if (!targetGoal) {
        const goalName = body.newGoalName?.trim() || `Alcancía de ${childCfg.childName}`;
        const goalTarget = Math.max(Number(body.targetAmount || 100), amount);
        targetGoal = await tx.savingsGoal.create({
          data: {
            householdId,
            name: goalName,
            targetAmount: goalTarget,
            currentAmount: 0,
          },
        });
        await tx.auditLog.create({
          data: {
            userId: parentUserId,
            householdId,
            action: 'GOAL_OWNERSHIP_META',
            details: JSON.stringify({
              goalId: targetGoal.id,
              childUserId: childCfg.childUserId,
              childName: childCfg.childName,
              emoji: body.emoji || '🐷',
            }),
          },
        });
      }

      await tx.transaction.create({
        data: {
          householdId,
          accountId: fromAccount.id,
          destinationAccountId: null,
          createdById: parentUserId,
          type: TransactionType.EXPENSE,
          amount,
          description:
            body.note?.trim() ||
            `🐷 Abono directo a ahorro de ${childCfg.childName}: ${targetGoal.name}`,
          date: new Date(),
        },
      });

      await tx.account.update({
        where: { id: fromAccount.id },
        data: { balance: { decrement: amount } },
      });

      const updatedGoal = await tx.savingsGoal.update({
        where: { id: targetGoal.id },
        data: { currentAmount: { increment: amount } },
      });

      await tx.auditLog.create({
        data: {
          userId: parentUserId,
          householdId,
          action: 'GOAL_DEPOSIT_LOG',
          details: JSON.stringify({
            goalId: targetGoal.id,
            childUserId: childCfg.childUserId,
            actorUserId: parentUserId,
            actorName: parentDisplayName,
            depositSource: 'PARENT_DIRECT',
            amount,
            note: body.note?.trim() || `Abono directo desde ${fromAccount.name}`,
            createdAt: new Date().toISOString(),
          }),
        },
      });

      await tx.notification.create({
        data: {
          userId: childCfg.childUserId,
          householdId,
          title: '🐷 ¡Tu tutor abonó a tu alcancía!',
          body: `${parentDisplayName} depositó $${amount.toFixed(2)} directo a tu objetivo "${targetGoal.name}".`,
          type: 'SAVINGS_GOAL_DEPOSIT',
        },
      });

      return updatedGoal;
    });

    this.eventsGateway?.notifyHouseholdChange(householdId, 'goal', 'UPDATE');
    this.eventsGateway?.notifyHouseholdChange(householdId, 'transaction', 'CREATE');
    this.eventsGateway?.notifyHouseholdChange(householdId, 'account', 'UPDATE');
    this.eventsGateway?.notifyHouseholdChange(householdId, 'notification', 'CREATE');

    return {
      success: true,
      goal: result,
      message: `Se abonaron $${amount.toFixed(2)} directo al objetivo "${targetGoal.name}" de ${childCfg.childName}.`,
    };
  }

  async delete(householdId: string, goalId: string, userId?: string) {
    const goal = await this.prisma.savingsGoal.findFirst({
      where: { id: goalId, householdId },
    });
    if (!goal) {
      return { count: 0 };
    }

    const { ownershipByGoalId } = await this.loadGoalMetadata(householdId);
    const meta = ownershipByGoalId.get(goalId);
    const childConfig = userId
      ? await ParentalControlHelper.getChildConfigIfDependent(this.prisma, householdId, userId)
      : null;

    if (childConfig) {
      if (meta?.childUserId !== childConfig.childUserId) {
        throw new ForbiddenException('Solo puedes eliminar tus propios objetivos de ahorro.');
      }
      if (Number(goal.currentAmount) > 0) {
        throw new ForbiddenException(
          'Este objetivo ya tiene dinero ahorrado. Pide a tu tutor si necesitas mover o cerrar esta meta.',
        );
      }
    }

    if (meta?.childUserId && Number(goal.currentAmount) > 0) {
      const configs = await ParentalControlHelper.getHouseholdParentalControls(this.prisma, householdId);
      const ownerCfg = configs.find((c) => c.childUserId === meta.childUserId);
      if (ownerCfg?.childAccountId) {
        await this.prisma.$transaction(async (tx) => {
          await tx.account.update({
            where: { id: ownerCfg.childAccountId },
            data: { balance: { increment: Number(goal.currentAmount) } },
          });
          await tx.transaction.create({
            data: {
              householdId,
              accountId: ownerCfg.childAccountId,
              type: TransactionType.INCOME,
              amount: Number(goal.currentAmount),
              description: `🐷 Liberación de ahorro: ${goal.name}`,
              date: new Date(),
              createdById: userId || null,
            },
          });
          await tx.savingsGoal.deleteMany({
            where: { id: goalId, householdId },
          });
        });

        this.eventsGateway?.notifyHouseholdChange(householdId, 'goal', 'DELETE');
        this.eventsGateway?.notifyHouseholdChange(householdId, 'account', 'UPDATE');
        this.eventsGateway?.notifyHouseholdChange(householdId, 'transaction', 'CREATE');
        return { count: 1, refundedAmount: Number(goal.currentAmount) };
      }
    }

    const res = await this.prisma.savingsGoal.deleteMany({
      where: { id: goalId, householdId },
    });
    this.eventsGateway?.notifyHouseholdChange(householdId, 'goal', 'DELETE');
    return res;
  }
}
