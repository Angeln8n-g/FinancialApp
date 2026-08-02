"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    hashPassword(password) {
        const salt = 'hogariq_dev_salt';
        return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                memberships: {
                    include: {
                        household: {
                            include: {
                                members: true,
                            },
                        },
                    },
                    orderBy: { joinedAt: 'desc' },
                },
            },
        });
        if (!user || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Credenciales inválidas o cuenta no activada');
        }
        const hashedPassword = this.hashPassword(password);
        if (user.passwordHash !== hashedPassword) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const sharedMembership = user.memberships.find(m => m.household.members.length > 1);
        const primaryMembership = sharedMembership || user.memberships[0];
        const householdId = primaryMembership ? primaryMembership.householdId : null;
        const payload = {
            sub: user.id,
            email: user.email,
            householdId,
        };
        const token = this.jwtService.sign(payload);
        return {
            accessToken: token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl,
            },
            household: primaryMembership?.household ? {
                id: primaryMembership.household.id,
                name: primaryMembership.household.name,
                role: primaryMembership.role,
            } : null,
            availableHouseholds: user.memberships.map(m => ({
                id: m.household.id,
                name: m.household.name,
                role: m.role,
                memberCount: m.household.members.length,
            })),
        };
    }
    async register(registerDto) {
        const { email, password, fullName } = registerDto;
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
            include: {
                memberships: {
                    include: { household: true },
                },
            },
        });
        const passwordHash = this.hashPassword(password);
        if (existingUser) {
            if (existingUser.passwordHash) {
                throw new common_1.ConflictException('El correo ya se encuentra registrado. Por favor inicia sesión.');
            }
            const updatedUser = await this.prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    fullName: fullName || existingUser.fullName,
                    passwordHash,
                },
                include: {
                    memberships: {
                        include: { household: true },
                        orderBy: { joinedAt: 'desc' },
                    },
                },
            });
            const primaryMembership = updatedUser.memberships[0];
            const payload = {
                sub: updatedUser.id,
                email: updatedUser.email,
                householdId: primaryMembership ? primaryMembership.householdId : null,
            };
            const token = this.jwtService.sign(payload);
            return {
                accessToken: token,
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    fullName: updatedUser.fullName,
                },
                household: primaryMembership?.household ? {
                    id: primaryMembership.household.id,
                    name: primaryMembership.household.name,
                    role: primaryMembership.role,
                } : null,
            };
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const household = await tx.household.create({
                data: {
                    name: `Hogar de ${fullName.split(' ')[0]}`,
                },
            });
            const user = await tx.user.create({
                data: {
                    email,
                    fullName,
                    passwordHash,
                },
            });
            const membership = await tx.householdMember.create({
                data: {
                    userId: user.id,
                    householdId: household.id,
                    role: 'ADMIN',
                },
            });
            const defaultCategories = [
                { name: 'Comida', icon: '🍽️', color: '#FF5733' },
                { name: 'Transporte', icon: '🚗', color: '#33FF57' },
                { name: 'Servicios', icon: '💡', color: '#3357FF' },
                { name: 'Suscripciones', icon: '📺', color: '#F333FF' },
                { name: 'Ahorros', icon: '🏦', color: '#FFC300' },
            ];
            for (const cat of defaultCategories) {
                await tx.category.create({
                    data: {
                        householdId: household.id,
                        name: cat.name,
                        icon: cat.icon,
                        color: cat.color,
                    },
                });
            }
            return { user, household, membership };
        });
        const payload = {
            sub: result.user.id,
            email: result.user.email,
            householdId: result.household.id,
        };
        const token = this.jwtService.sign(payload);
        return {
            accessToken: token,
            user: {
                id: result.user.id,
                email: result.user.email,
                fullName: result.user.fullName,
            },
            household: {
                id: result.household.id,
                name: result.household.name,
                role: result.membership.role,
            },
        };
    }
    async switchHousehold(userId, targetHouseholdId) {
        const membership = await this.prisma.householdMember.findUnique({
            where: {
                userId_householdId: {
                    userId,
                    householdId: targetHouseholdId,
                },
            },
            include: {
                user: true,
                household: true,
            },
        });
        if (!membership) {
            throw new common_1.UnauthorizedException('No perteneces a este hogar');
        }
        const payload = {
            sub: membership.userId,
            email: membership.user.email,
            householdId: targetHouseholdId,
        };
        const token = this.jwtService.sign(payload);
        return {
            accessToken: token,
            user: {
                id: membership.user.id,
                email: membership.user.email,
                fullName: membership.user.fullName,
                avatarUrl: membership.user.avatarUrl,
            },
            household: {
                id: membership.household.id,
                name: membership.household.name,
                role: membership.role,
            },
        };
    }
    async getMe(userId, householdId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                memberships: {
                    include: {
                        household: {
                            include: { members: true },
                        },
                    },
                    orderBy: { joinedAt: 'desc' },
                },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuario no encontrado');
        }
        const currentMembership = user.memberships.find(m => m.householdId === householdId) || user.memberships[0];
        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl,
            },
            household: currentMembership?.household ? {
                id: currentMembership.household.id,
                name: currentMembership.household.name,
                role: currentMembership.role,
            } : null,
            availableHouseholds: user.memberships.map(m => ({
                id: m.household.id,
                name: m.household.name,
                role: m.role,
                memberCount: m.household.members.length,
            })),
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map