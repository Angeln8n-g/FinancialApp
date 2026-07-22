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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseholdService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let HouseholdService = class HouseholdService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMembers(householdId) {
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
    async inviteMember(currentUserId, householdId, dto) {
        const currentMember = await this.prisma.householdMember.findUnique({
            where: {
                userId_householdId: {
                    userId: currentUserId,
                    householdId,
                },
            },
        });
        if (!currentMember || currentMember.role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Solo los administradores pueden invitar nuevos miembros');
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
            throw new common_1.ConflictException('El usuario ya pertenece a este hogar');
        }
        return this.prisma.householdMember.create({
            data: {
                userId: targetUser.id,
                householdId,
                role: dto.role || client_1.Role.COLLABORATOR,
            },
            include: {
                user: true,
            },
        });
    }
    async updateRole(currentUserId, householdId, memberId, dto) {
        const currentMember = await this.prisma.householdMember.findUnique({
            where: {
                userId_householdId: {
                    userId: currentUserId,
                    householdId,
                },
            },
        });
        if (!currentMember || currentMember.role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Solo los administradores pueden cambiar roles');
        }
        const memberToUpdate = await this.prisma.householdMember.findFirst({
            where: { id: memberId, householdId },
        });
        if (!memberToUpdate) {
            throw new common_1.NotFoundException('Miembro no encontrado en este hogar');
        }
        return this.prisma.householdMember.update({
            where: { id: memberId },
            data: { role: dto.role },
        });
    }
};
exports.HouseholdService = HouseholdService;
exports.HouseholdService = HouseholdService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HouseholdService);
//# sourceMappingURL=household.service.js.map