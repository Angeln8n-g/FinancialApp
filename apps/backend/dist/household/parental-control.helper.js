"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentalControlHelper = void 0;
const client_1 = require("@prisma/client");
class ParentalControlHelper {
    static configCache = new Map();
    static getKey(householdId, childUserId) {
        return `${householdId}:${childUserId}`;
    }
    static async saveConfig(prisma, config, actorUserId) {
        const updated = {
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
        }
        catch {
        }
        return updated;
    }
    static async ensureChildSetup(prisma, params) {
        const { householdId, childUserId, childEmail, childName, memberId, parentEmail, parentUserId, initialBalance = 0, existingAccountId, maxDailySpend = 25, maxSingleTransaction = 15, requireApprovalAbove = 10, allowanceAmount = 50, allowancePeriod = client_1.RecurrencePeriod.WEEKLY, } = params;
        const firstName = (childName || childEmail.split('@')[0]).split(' ')[0];
        const expectedAccountPrefix = `Cuenta Niño - ${firstName}`;
        let childAccount = null;
        if (existingAccountId) {
            childAccount = await prisma.account?.findFirst?.({
                where: { id: existingAccountId, householdId },
            });
        }
        if (!childAccount && prisma.account?.findMany) {
            const allAccounts = await prisma.account.findMany({
                where: { householdId },
            });
            childAccount = allAccounts.find((a) => a.name.toLowerCase().includes(childEmail.toLowerCase()) ||
                a.name.toLowerCase().includes(`niño - ${firstName.toLowerCase()}`) ||
                a.name.toLowerCase().includes(`infantil de ${firstName.toLowerCase()}`) ||
                a.name.toLowerCase().includes(`infantil - ${firstName.toLowerCase()}`));
        }
        if (!childAccount && prisma.account?.create) {
            childAccount = await prisma.account.create({
                data: {
                    householdId,
                    name: `${expectedAccountPrefix} (${childEmail})`,
                    type: client_1.AccountType.SAVINGS,
                    balance: initialBalance,
                    currency: 'USD',
                },
            });
        }
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
        const config = {
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
    static async getHouseholdParentalControls(prisma, householdId) {
        if (!householdId)
            return [];
        try {
            if (prisma.auditLog?.findMany) {
                const logs = await prisma.auditLog.findMany({
                    where: { householdId, action: 'PARENTAL_CONTROL_CONFIG' },
                    orderBy: { timestamp: 'asc' },
                });
                for (const log of logs) {
                    if (log.details) {
                        try {
                            const parsed = JSON.parse(log.details);
                            if (parsed && parsed.childUserId) {
                                this.configCache.set(this.getKey(householdId, parsed.childUserId), parsed);
                            }
                        }
                        catch {
                        }
                    }
                }
            }
        }
        catch {
        }
        let members = [];
        try {
            if (prisma.householdMember?.findMany) {
                members = await prisma.householdMember.findMany({
                    where: { householdId },
                    include: { user: true },
                    orderBy: { joinedAt: 'asc' },
                });
            }
        }
        catch {
            members = [];
        }
        const adminMember = members.find((m) => m.role === client_1.Role.ADMIN) || members.find((m) => m.role !== client_1.Role.DEPENDENT);
        const defaultParentEmail = adminMember?.user?.email || 'tutor@hogariq.com';
        const defaultParentUserId = adminMember?.userId || '';
        const dependentMembers = members.filter((m) => m.role === client_1.Role.DEPENDENT);
        const result = [];
        for (const dep of dependentMembers) {
            const key = this.getKey(householdId, dep.userId);
            let cfg = this.configCache.get(key);
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
            }
            else {
                cfg.memberId = dep.id;
                cfg.childEmail = dep.user?.email || cfg.childEmail;
                cfg.childName = dep.user?.fullName || cfg.childName;
                if (!cfg.parentEmail)
                    cfg.parentEmail = extractedParentEmail;
                if (!cfg.parentUserId)
                    cfg.parentUserId = defaultParentUserId;
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
    static async getChildConfigIfDependent(prisma, householdId, userId) {
        if (!householdId || !userId)
            return null;
        let membership = null;
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
        }
        catch {
            return null;
        }
        if (!membership || membership.role !== client_1.Role.DEPENDENT) {
            return null;
        }
        const allConfigs = await this.getHouseholdParentalControls(prisma, householdId);
        return allConfigs.find((c) => c.childUserId === userId) || null;
    }
}
exports.ParentalControlHelper = ParentalControlHelper;
//# sourceMappingURL=parental-control.helper.js.map