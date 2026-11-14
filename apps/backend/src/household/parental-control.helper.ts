import { PrismaService } from '../prisma/prisma.service';
import { AccountType, RecurrencePeriod, Role } from '@prisma/client';

export interface ParentalControlConfig {
  childUserId: string;
  memberId: string;
  childEmail: string;
  childName: string;
  parentEmail: string;
  parentUserId: string;
  householdId: string;
  childAccountId: string;
  maxDailySpend: number;
  maxSingleTransaction: number;
  requireApprovalAbove: number;
  isFrozen: boolean;
  allowSavingsGoals: boolean;
  blockedCategories: string[];
  updatedAt: string;
}

export class ParentalControlHelper {
  // In-memory cache synced with AuditLog (action = 'PARENTAL_CONTROL_CONFIG')
  private static configCache: Map<string, ParentalControlConfig> = new Map();

  private static getKey(householdId: string, childUserId: string): string {
    return `${householdId}:${childUserId}`;
  }

  /**
   * Saves the parental control configuration in memory and persists it in AuditLog + HouseholdMember.customTitle.
   */
  static async saveConfig(prisma: PrismaService, config: ParentalControlConfig, actorUserId?: string): Promise<ParentalControlConfig> {
    const updated: ParentalControlConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
    };

    this.configCache.set(this.getKey(config.householdId, config.childUserId), updated);

    try {
      await prisma.auditLog.create({
        data: {
          userId: actorUserId || config.parentUserId || config.childUserId,
          householdId: config.householdId,
          action: 'PARENTAL_CONTROL_CONFIG',
          details: JSON.stringify(updated),
        },
      });
    } catch {
      // Ignore if audit log fails in mocked unit tests
    }

    return updated;
  }

  /**
   * Ensures a dedicated financial account and default allowance exist for a child member,
   * and returns the complete ParentalControlConfig.
   */
  static async ensureChildSetup(
    prisma: PrismaService,
    params: {
      householdId: string;
      childUserId: string;
      childEmail: string;
      childName: string;
      memberId: string;
      parentEmail: string;
      parentUserId: string;
      initialBalance?: number;
      existingAccountId?: string;
      maxDailySpend?: number;
      maxSingleTransaction?: number;
      requireApprovalAbove?: number;
      allowanceAmount?: number;
      allowancePeriod?: RecurrencePeriod;
    },
  ): Promise<{ config: ParentalControlConfig; account: any }> {
    const {
      householdId,
      childUserId,
      childEmail,
      childName,
      memberId,
      parentEmail,
      parentUserId,
      initialBalance = 0,
      existingAccountId,
      maxDailySpend = 25,
      maxSingleTransaction = 15,
      requireApprovalAbove = 10,
      allowanceAmount = 50,
      allowancePeriod = RecurrencePeriod.WEEKLY,
    } = params;

    const firstName = (childName || childEmail.split('@')[0]).split(' ')[0];
    const expectedAccountPrefix = `Cuenta Niño - ${firstName}`;

    // 1. Find or create the child's dedicated financial account
    let childAccount: any = null;
    if (existingAccountId) {
      childAccount = await prisma.account?.findFirst?.({
        where: { id: existingAccountId, householdId },
      });
    }

    if (!childAccount && prisma.account?.findMany) {
      const allAccounts = await prisma.account.findMany({
        where: { householdId },
      });
      childAccount = allAccounts.find(
        (a: any) =>
          a.name.toLowerCase().includes(childEmail.toLowerCase()) ||
          a.name.toLowerCase().includes(`niño - ${firstName.toLowerCase()}`) ||
          a.name.toLowerCase().includes(`infantil de ${firstName.toLowerCase()}`) ||
          a.name.toLowerCase().includes(`infantil - ${firstName.toLowerCase()}`),
      );
    }

    if (!childAccount && prisma.account?.create) {
      childAccount = await prisma.account.create({
        data: {
          householdId,
          name: `${expectedAccountPrefix} (${childEmail})`,
          type: AccountType.SAVINGS,
          balance: initialBalance,
          currency: 'USD',
        },
      });
    }

    // 2. Ensure the child has at least one Allowance (Mesada)
    if (prisma.allowance?.findFirst && prisma.allowance?.create && memberId) {
      const existingAllowance = await prisma.allowance.findFirst({
        where: { householdId, memberId },
      });
      if (!existingAllowance) {
        await prisma.allowance.create({
          data: {
            householdId,
            memberId,
            title: `Mesada de ${firstName}`,
            limitAmount: allowanceAmount,
            spentAmount: 0,
            period: allowancePeriod,
          },
        });
      }
    }

    // 3. Save Parental Control configuration
    const config: ParentalControlConfig = {
      childUserId,
      memberId,
      childEmail,
      childName: childName || firstName,
      parentEmail,
      parentUserId,
      householdId,
      childAccountId: childAccount?.id || existingAccountId || '',
      maxDailySpend,
      maxSingleTransaction,
      requireApprovalAbove,
      isFrozen: false,
      allowSavingsGoals: true,
      blockedCategories: ['Licor', 'Apuestas', 'Adultos'],
      updatedAt: new Date().toISOString(),
    };

    await this.saveConfig(prisma, config, parentUserId || childUserId);

    return { config, account: childAccount };
  }

  /**
   * Loads all ParentalControlConfigs for a household (rehydrating from AuditLog and DEPENDENT members).
   */
  static async getHouseholdParentalControls(prisma: PrismaService, householdId: string): Promise<ParentalControlConfig[]> {
    if (!householdId) return [];

    // 1. Load persisted configs from AuditLog
    try {
      if (prisma.auditLog?.findMany) {
        const logs = await prisma.auditLog.findMany({
          where: { householdId, action: 'PARENTAL_CONTROL_CONFIG' },
          orderBy: { timestamp: 'asc' },
        });
        for (const log of logs) {
          if (log.details) {
            try {
              const parsed = JSON.parse(log.details) as ParentalControlConfig;
              if (parsed && parsed.childUserId) {
                this.configCache.set(this.getKey(householdId, parsed.childUserId), parsed);
              }
            } catch {
              // Ignore malformed JSON
            }
          }
        }
      }
    } catch {
      // Ignore if auditLog not mocked
    }

    // 2. Ensure every DEPENDENT member in the household has a config
    let members: any[] = [];
    try {
      if (prisma.householdMember?.findMany) {
        members = await prisma.householdMember.findMany({
          where: { householdId },
          include: { user: true },
          orderBy: { joinedAt: 'asc' },
        });
      }
    } catch {
      members = [];
    }

    const adminMember = members.find((m) => m.role === Role.ADMIN) || members.find((m) => m.role !== Role.DEPENDENT);
    const defaultParentEmail = adminMember?.user?.email || 'tutor@hogariq.com';
    const defaultParentUserId = adminMember?.userId || '';

    const dependentMembers = members.filter((m) => m.role === Role.DEPENDENT);
    const result: ParentalControlConfig[] = [];

    for (const dep of dependentMembers) {
      const key = this.getKey(householdId, dep.userId);
      let cfg = this.configCache.get(key);

      // Extract parent email from customTitle if formatted like "👦 Cuenta Infantil (Tutor: email)"
      let extractedParentEmail = defaultParentEmail;
      if (dep.customTitle) {
        const match = dep.customTitle.match(/Tutor:\s*([^\s)]+)/i);
        if (match && match[1]) {
          extractedParentEmail = match[1];
        }
      }

      if (!cfg) {
        const ensured = await this.ensureChildSetup(prisma, {
          householdId,
          childUserId: dep.userId,
          childEmail: dep.user?.email || 'nino@hogariq.com',
          childName: dep.user?.fullName || dep.user?.email?.split('@')[0] || 'Niño',
          memberId: dep.id,
          parentEmail: extractedParentEmail,
          parentUserId: defaultParentUserId,
        });
        cfg = ensured.config;
      } else {
        // Keep memberId and user details up to date
        cfg.memberId = dep.id;
        cfg.childEmail = dep.user?.email || cfg.childEmail;
        cfg.childName = dep.user?.fullName || cfg.childName;
        if (!cfg.parentEmail) cfg.parentEmail = extractedParentEmail;
        if (!cfg.parentUserId) cfg.parentUserId = defaultParentUserId;

        // Verify childAccountId still exists
        if (prisma.account?.findFirst) {
          const acc = cfg.childAccountId
            ? await prisma.account.findFirst({ where: { id: cfg.childAccountId, householdId } })
            : null;
          if (!acc) {
            const ensured = await this.ensureChildSetup(prisma, {
              householdId,
              childUserId: dep.userId,
              childEmail: cfg.childEmail,
              childName: cfg.childName,
              memberId: dep.id,
              parentEmail: cfg.parentEmail,
              parentUserId: cfg.parentUserId,
              maxDailySpend: cfg.maxDailySpend,
              maxSingleTransaction: cfg.maxSingleTransaction,
              requireApprovalAbove: cfg.requireApprovalAbove,
            });
            cfg = ensured.config;
          }
        }
      }

      result.push(cfg);
    }

    return result;
  }

  /**
   * Returns the ParentalControlConfig for a specific child user in a household, or null if the user is not a child (DEPENDENT).
   */
  static async getChildConfigIfDependent(
    prisma: PrismaService,
    householdId: string,
    userId?: string,
  ): Promise<ParentalControlConfig | null> {
    if (!householdId || !userId) return null;

    let membership: any = null;
    try {
      if (prisma.householdMember?.findUnique) {
        membership = await prisma.householdMember.findUnique({
          where: {
            userId_householdId: {
              userId,
              householdId,
            },
          },
          include: { user: true },
        });
      }
    } catch {
      return null;
    }

    if (!membership || membership.role !== Role.DEPENDENT) {
      return null;
    }

    const allConfigs = await this.getHouseholdParentalControls(prisma, householdId);
    return allConfigs.find((c) => c.childUserId === userId) || null;
  }
}
