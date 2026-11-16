"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AllowancesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllowancesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const parental_control_helper_1 = require("../household/parental-control.helper");
const events_gateway_1 = require("../events/events.gateway");
let AllowancesService = class AllowancesService {
    static { AllowancesService_1 = this; }
    prisma;
    eventsGateway;
    static missionsMap = new Map();
    static matchingRulesMap = new Map();
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
    }
    async findAll(householdId) {
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
    async create(householdId, data) {
        return this.prisma.allowance.create({
            data: {
                householdId,
                memberId: data.memberId,
                title: data.title,
                limitAmount: data.limitAmount,
                spentAmount: 0,
                period: data.period || client_1.RecurrencePeriod.MONTHLY,
            },
        });
    }
    async recordExpense(householdId, id, amount) {
        const allowance = await this.prisma.allowance.findFirst({
            where: { id, householdId },
        });
        if (!allowance)
            throw new common_1.NotFoundException('Mesada no encontrada');
        return this.prisma.allowance.update({
            where: { id },
            data: {
                spentAmount: { increment: amount },
            },
        });
    }
    async disburse(householdId, id, data) {
        const allowance = await this.prisma.allowance.findFirst({
            where: { id, householdId },
            include: { member: { include: { user: true } } },
        });
        if (!allowance)
            throw new common_1.NotFoundException('Mesada no encontrada');
        const account = await this.prisma.account.findFirst({
            where: { id: data.accountId, householdId },
        });
        if (!account)
            throw new common_1.NotFoundException('Cuenta no encontrada');
        const disburseAmount = data.amount || Number(allowance.limitAmount);
        const configs = await parental_control_helper_1.ParentalControlHelper.getHouseholdParentalControls(this.prisma, householdId);
        const childCfg = configs.find((c) => c.memberId === allowance.memberId || c.childUserId === allowance.member?.userId);
        const result = await this.prisma.$transaction(async (tx) => {
            const hasLinkedChildAcc = Boolean(childCfg?.childAccountId && childCfg.childAccountId !== account.id);
            await tx.transaction.create({
                data: {
                    householdId,
                    accountId: account.id,
                    destinationAccountId: hasLinkedChildAcc ? childCfg.childAccountId : null,
                    type: hasLinkedChildAcc ? client_1.TransactionType.TRANSFER : client_1.TransactionType.EXPENSE,
                    amount: disburseAmount,
                    description: `Desembolso Mesada: ${allowance.title} (${allowance.member.user.fullName})`,
                    date: new Date(),
                },
            });
            await tx.account.update({
                where: { id: account.id },
                data: { balance: { decrement: disburseAmount } },
            });
            if (hasLinkedChildAcc) {
                await tx.account.update({
                    where: { id: childCfg.childAccountId },
                    data: { balance: { increment: disburseAmount } },
                });
            }
            if (allowance.member?.userId) {
                await tx.notification.create({
                    data: {
                        userId: allowance.member.userId,
                        householdId,
                        title: '💰 ¡Mesada Recibida!',
                        body: `Se acreditaron $${disburseAmount.toFixed(2)} en tu cuenta por "${allowance.title}".`,
                        type: 'ALLOWANCE_DISBURSED',
                    },
                });
            }
            return {
                success: true,
                message: `Desembolso de $${disburseAmount} realizado desde ${account.name}${hasLinkedChildAcc ? ' y acreditado en la cuenta del niño' : ''}`,
            };
        });
        this.eventsGateway?.notifyHouseholdChange(householdId, 'transaction', 'CREATE');
        this.eventsGateway?.notifyHouseholdChange(householdId, 'account', 'UPDATE');
        this.eventsGateway?.notifyHouseholdChange(householdId, 'notification', 'CREATE');
        return result;
    }
    async reset(householdId, id) {
        const allowance = await this.prisma.allowance.findFirst({
            where: { id, householdId },
        });
        if (!allowance)
            throw new common_1.NotFoundException('Mesada no encontrada');
        return this.prisma.allowance.update({
            where: { id },
            data: { spentAmount: 0 },
        });
    }
    async createRequest(householdId, userId, memberId, allowanceId, amount, reason) {
        const allowance = await this.prisma.allowance.findFirst({
            where: { id: allowanceId, householdId },
        });
        if (!allowance) {
            throw new common_1.NotFoundException('Mesada no encontrada');
        }
        let resolvedMemberId = memberId;
        if (!resolvedMemberId) {
            const currentMember = await this.prisma.householdMember.findUnique({
                where: {
                    userId_householdId: {
                        userId,
                        householdId,
                    },
                },
            });
            resolvedMemberId = currentMember?.id || allowance.memberId;
        }
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            throw new common_1.BadRequestException('El monto de la solicitud debe ser mayor a 0.');
        }
        const cleanReason = (reason || '').trim();
        if (!cleanReason) {
            throw new common_1.BadRequestException('Debes indicar un motivo para la solicitud.');
        }
        const req = await this.prisma.allowanceRequest.create({
            data: {
                householdId,
                memberId: resolvedMemberId,
                allowanceId,
                amount: numericAmount,
                reason: cleanReason,
                status: 'PENDING',
            },
            include: {
                member: { include: { user: true } },
            },
        });
        const admins = await this.prisma.householdMember.findMany({
            where: { householdId, role: 'ADMIN' },
        });
        const requesterName = req.member.user.fullName || req.member.user.email.split('@')[0];
        for (const admin of admins) {
            await this.prisma.notification.create({
                data: {
                    userId: admin.userId,
                    householdId,
                    title: '🙋‍♂️ Solicitud de Control Parental / Dinero Extra',
                    body: `${requesterName} solicita $${numericAmount} para: "${cleanReason}"`,
                    type: 'ALLOWANCE_REQUEST',
                },
            });
        }
        this.eventsGateway?.notifyHouseholdChange(householdId, 'notification', 'CREATE');
        return req;
    }
    async getRequests(householdId) {
        return this.prisma.allowanceRequest.findMany({
            where: { householdId },
            include: {
                member: { include: { user: true } },
                allowance: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async respondRequest(householdId, requestId, status) {
        const req = await this.prisma.allowanceRequest.findFirst({
            where: { id: requestId, householdId },
            include: { member: true },
        });
        if (!req)
            throw new common_1.NotFoundException('Solicitud no encontrada');
        const updated = await this.prisma.allowanceRequest.update({
            where: { id: requestId },
            data: { status },
        });
        if (status === 'APPROVED') {
            await this.prisma.allowance.update({
                where: { id: req.allowanceId },
                data: { limitAmount: { increment: req.amount } },
            });
            const configs = await parental_control_helper_1.ParentalControlHelper.getHouseholdParentalControls(this.prisma, householdId);
            const childCfg = configs.find((c) => c.memberId === req.memberId);
            if (childCfg?.childAccountId) {
                await this.prisma.account.update({
                    where: { id: childCfg.childAccountId },
                    data: { balance: { increment: req.amount } },
                }).catch(() => null);
            }
        }
        if (req.member?.userId) {
            await this.prisma.notification.create({
                data: {
                    userId: req.member.userId,
                    householdId,
                    title: status === 'APPROVED' ? '🎉 Solicitud Aprobada por Papá/Mamá' : '❌ Solicitud No Aprobada',
                    body: status === 'APPROVED'
                        ? `Tu solicitud de $${Number(req.amount).toFixed(2)} para "${req.reason}" fue aprobada.`
                        : `Tu solicitud de $${Number(req.amount).toFixed(2)} para "${req.reason}" fue rechazada.`,
                    type: 'ALLOWANCE_REQUEST',
                },
            }).catch(() => null);
        }
        this.eventsGateway?.notifyHouseholdChange(householdId, 'notification', 'CREATE');
        return updated;
    }
    async remove(id, householdId) {
        return this.prisma.allowance.deleteMany({
            where: { id, householdId },
        });
    }
    async getMissions(householdId) {
        if (!AllowancesService_1.missionsMap.has(householdId)) {
            const members = await this.prisma.householdMember.findMany({
                where: { householdId },
                include: { user: true },
            });
            const sampleMember = members.find((m) => m.role === 'DEPENDENT') || members[0];
            const memberName = sampleMember ? (sampleMember.user.fullName || sampleMember.user.email) : 'Hijo / Familiar';
            const memberId = sampleMember ? sampleMember.id : 'default';
            const initialMissions = [
                {
                    id: (0, crypto_1.randomUUID)(),
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
                    id: (0, crypto_1.randomUUID)(),
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
                    id: (0, crypto_1.randomUUID)(),
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
            AllowancesService_1.missionsMap.set(householdId, initialMissions);
        }
        return AllowancesService_1.missionsMap.get(householdId) || [];
    }
    async createMission(householdId, data) {
        if (!data.title || data.rewardAmount <= 0) {
            throw new common_1.BadRequestException('Título y monto de recompensa positivo son requeridos');
        }
        const member = await this.prisma.householdMember.findFirst({
            where: { id: data.memberId, householdId },
            include: { user: true },
        });
        const memberName = member ? (member.user.fullName || member.user.email) : 'Hijo / Familiar';
        const newMission = {
            id: (0, crypto_1.randomUUID)(),
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
        AllowancesService_1.missionsMap.set(householdId, current);
        return newMission;
    }
    async completeMission(householdId, missionId, memberId) {
        const missions = await this.getMissions(householdId);
        const mission = missions.find((m) => m.id === missionId);
        if (!mission)
            throw new common_1.NotFoundException('Misión no encontrada');
        mission.status = 'COMPLETED';
        mission.completedAt = new Date().toISOString();
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
                    type: 'MISSION_COMPLETED',
                },
            });
        }
        this.eventsGateway?.notifyHouseholdChange(householdId, 'notification', 'CREATE');
        return mission;
    }
    async approveAndPayMission(householdId, missionId, data, parentUserId) {
        const missions = await this.getMissions(householdId);
        const mission = missions.find((m) => m.id === missionId);
        if (!mission)
            throw new common_1.NotFoundException('Misión no encontrada');
        const account = await this.prisma.account.findFirst({
            where: { id: data.accountId, householdId },
        });
        if (!account)
            throw new common_1.NotFoundException('Cuenta de desembolso no encontrada');
        const configs = await parental_control_helper_1.ParentalControlHelper.getHouseholdParentalControls(this.prisma, householdId);
        let childCfg = configs.find((c) => c.memberId === mission.memberId || c.childName === mission.memberName);
        const memberRecord = await this.prisma.householdMember.findFirst({
            where: { id: mission.memberId, householdId },
        });
        if (!childCfg && memberRecord) {
            childCfg = configs.find((c) => c.childUserId === memberRecord.userId);
        }
        const hasLinkedChildAcc = Boolean(childCfg?.childAccountId && childCfg.childAccountId !== account.id);
        const targetChildUserId = childCfg?.childUserId || memberRecord?.userId || null;
        await this.prisma.$transaction(async (tx) => {
            await tx.transaction.create({
                data: {
                    householdId,
                    accountId: account.id,
                    destinationAccountId: hasLinkedChildAcc ? childCfg.childAccountId : null,
                    type: hasLinkedChildAcc ? client_1.TransactionType.TRANSFER : client_1.TransactionType.EXPENSE,
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
            if (hasLinkedChildAcc) {
                await tx.account.update({
                    where: { id: childCfg.childAccountId },
                    data: { balance: { increment: mission.rewardAmount } },
                });
            }
            if (targetChildUserId) {
                await tx.notification.create({
                    data: {
                        userId: targetChildUserId,
                        householdId,
                        title: '🏆 ¡Misión Aprobada y Pagada!',
                        body: `Completaste "${mission.title}" y recibiste +$${mission.rewardAmount.toFixed(2)} en tu cuenta.`,
                        type: 'MISSION_PAID',
                    },
                });
            }
        });
        mission.status = 'APPROVED_AND_PAID';
        mission.approvedAt = new Date().toISOString();
        this.eventsGateway?.notifyHouseholdChange(householdId, 'transaction', 'CREATE');
        this.eventsGateway?.notifyHouseholdChange(householdId, 'account', 'UPDATE');
        this.eventsGateway?.notifyHouseholdChange(householdId, 'notification', 'CREATE');
        return {
            mission,
            message: `¡Recompensa de $${mission.rewardAmount.toFixed(2)} transferida con éxito desde ${account.name}!`,
        };
    }
    async deleteMission(householdId, missionId) {
        const missions = await this.getMissions(householdId);
        const filtered = missions.filter((m) => m.id !== missionId);
        AllowancesService_1.missionsMap.set(householdId, filtered);
        return true;
    }
    getSavingsMatching(householdId) {
        if (!AllowancesService_1.matchingRulesMap.has(householdId)) {
            AllowancesService_1.matchingRulesMap.set(householdId, {
                householdId,
                matchPercentage: 50,
                maxMonthlyBonus: 50,
                active: true,
                totalMatchedThisMonth: 15.0,
            });
        }
        return AllowancesService_1.matchingRulesMap.get(householdId);
    }
    updateSavingsMatching(householdId, data) {
        const current = this.getSavingsMatching(householdId);
        const updated = {
            ...current,
            matchPercentage: Math.max(0, Math.min(200, data.matchPercentage)),
            maxMonthlyBonus: Math.max(0, data.maxMonthlyBonus),
            active: data.active,
        };
        AllowancesService_1.matchingRulesMap.set(householdId, updated);
        return updated;
    }
};
exports.AllowancesService = AllowancesService;
exports.AllowancesService = AllowancesService = AllowancesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_gateway_1.EventsGateway])
], AllowancesService);
//# sourceMappingURL=allowances.service.js.map