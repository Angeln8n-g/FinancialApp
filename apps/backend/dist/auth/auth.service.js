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
const parental_control_helper_1 = require("../household/parental-control.helper");
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    hashPassword(password) {
        const salt = crypto.randomBytes(16).toString('hex');
        const iterations = 100000;
        const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
        return `pbkdf2$${iterations}$${salt}$${hash}`;
    }
    verifyPassword(password, storedHash) {
        if (storedHash.startsWith('pbkdf2$')) {
            const parts = storedHash.split('$');
            if (parts.length === 4) {
                const iterations = parseInt(parts[1], 10);
                const salt = parts[2];
                const hash = parts[3];
                const computed = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
                const hashBuf = Buffer.from(hash, 'hex');
                const compBuf = Buffer.from(computed, 'hex');
                return hashBuf.length === compBuf.length && crypto.timingSafeEqual(hashBuf, compBuf);
            }
        }
        const legacySalt = 'hogariq_dev_salt';
        const legacyHashed = crypto.pbkdf2Sync(password, legacySalt, 1000, 64, 'sha512').toString('hex');
        return storedHash === legacyHashed;
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
        const isValid = this.verifyPassword(password, user.passwordHash);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        if (!user.passwordHash.startsWith('pbkdf2$')) {
            const newHash = this.hashPassword(password);
            await this.prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: newHash },
            }).catch(() => null);
        }
        const sharedMembership = user.memberships.find(m => m.household.members.length > 1);
        const primaryMembership = sharedMembership || user.memberships[0];
        const householdId = primaryMembership ? primaryMembership.householdId : null;
        const isChildAccount = primaryMembership?.role === 'DEPENDENT';
        let childConfig = null;
        if (isChildAccount && householdId) {
            childConfig = await parental_control_helper_1.ParentalControlHelper.getChildConfigIfDependent(this.prisma, householdId, user.id);
        }
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
                isChildAccount,
                parentEmail: childConfig?.parentEmail || null,
                childAccountId: childConfig?.childAccountId || null,
            },
            household: primaryMembership?.household ? {
                id: primaryMembership.household.id,
                name: primaryMembership.household.name,
                role: primaryMembership.role,
                isChildAccount,
                parentEmail: childConfig?.parentEmail || null,
                childAccountId: childConfig?.childAccountId || null,
                parentalControls: childConfig || null,
            } : null,
            availableHouseholds: isChildAccount
                ? (primaryMembership?.household ? [{
                        id: primaryMembership.household.id,
                        name: primaryMembership.household.name,
                        role: primaryMembership.role,
                        memberCount: primaryMembership.household.members.length,
                    }] : [])
                : user.memberships.map(m => ({
                    id: m.household.id,
                    name: m.household.name,
                    role: m.role,
                    memberCount: m.household.members.length,
                })),
        };
    }
    async register(registerDto) {
        const { email, password, fullName, isChildAccount, parentEmail } = registerDto;
        if (isChildAccount) {
            if (!parentEmail || !parentEmail.trim()) {
                throw new common_1.BadRequestException('Debes ingresar el correo electrónico del padre o tutor para activar el control parental.');
            }
            if (parentEmail.trim().toLowerCase() === email.trim().toLowerCase()) {
                throw new common_1.BadRequestException('El correo del padre o tutor debe ser distinto al correo de la cuenta del niño.');
            }
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
            include: {
                memberships: {
                    include: { household: true },
                },
            },
        });
        if (existingUser && existingUser.passwordHash) {
            throw new common_1.ConflictException('El correo ya se encuentra registrado. Por favor inicia sesión.');
        }
        const passwordHash = this.hashPassword(password);
        if (isChildAccount && parentEmail) {
            const cleanParentEmail = parentEmail.trim().toLowerCase();
            const childResult = await this.prisma.$transaction(async (tx) => {
                let parentUser = await tx.user.findUnique({
                    where: { email: cleanParentEmail },
                    include: {
                        memberships: {
                            include: { household: true },
                            orderBy: { joinedAt: 'asc' },
                        },
                    },
                });
                let targetHousehold = parentUser?.memberships?.find((m) => m.role === 'ADMIN')?.household
                    || parentUser?.memberships?.[0]?.household
                    || null;
                if (!parentUser) {
                    parentUser = await tx.user.create({
                        data: {
                            email: cleanParentEmail,
                            fullName: cleanParentEmail.split('@')[0],
                        },
                        include: {
                            memberships: {
                                include: { household: true },
                            },
                        },
                    });
                }
                if (!targetHousehold) {
                    const parentFirstName = (parentUser.fullName || cleanParentEmail.split('@')[0]).split(' ')[0];
                    targetHousehold = await tx.household.create({
                        data: {
                            name: `Hogar de ${parentFirstName}`,
                        },
                    });
                    await tx.householdMember.create({
                        data: {
                            userId: parentUser.id,
                            householdId: targetHousehold.id,
                            role: 'ADMIN',
                            customTitle: '👨‍👩‍👧 Padre / Tutor (Control Parental)',
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
                                householdId: targetHousehold.id,
                                name: cat.name,
                                icon: cat.icon,
                                color: cat.color,
                            },
                        });
                    }
                }
                let childUser;
                if (existingUser) {
                    childUser = await tx.user.update({
                        where: { id: existingUser.id },
                        data: {
                            fullName: fullName || existingUser.fullName,
                            passwordHash,
                        },
                    });
                }
                else {
                    childUser = await tx.user.create({
                        data: {
                            email: email.trim().toLowerCase(),
                            fullName,
                            passwordHash,
                        },
                    });
                }
                const customTitle = `👦 Cuenta Infantil (Tutor: ${cleanParentEmail})`;
                let childMembership = await tx.householdMember.findUnique({
                    where: {
                        userId_householdId: {
                            userId: childUser.id,
                            householdId: targetHousehold.id,
                        },
                    },
                });
                if (childMembership) {
                    childMembership = await tx.householdMember.update({
                        where: { id: childMembership.id },
                        data: {
                            role: 'DEPENDENT',
                            customTitle,
                        },
                    });
                }
                else {
                    childMembership = await tx.householdMember.create({
                        data: {
                            userId: childUser.id,
                            householdId: targetHousehold.id,
                            role: 'DEPENDENT',
                            customTitle,
                        },
                    });
                }
                const childFirstName = (fullName || email.split('@')[0]).split(' ')[0];
                const childAccount = await tx.account.create({
                    data: {
                        householdId: targetHousehold.id,
                        name: `Cuenta Niño - ${childFirstName} (${email.trim().toLowerCase()})`,
                        type: 'SAVINGS',
                        balance: 0,
                        currency: 'USD',
                    },
                });
                await tx.allowance.create({
                    data: {
                        householdId: targetHousehold.id,
                        memberId: childMembership.id,
                        title: `Mesada de ${childFirstName}`,
                        limitAmount: 50,
                        spentAmount: 0,
                        period: 'WEEKLY',
                    },
                });
                await tx.notification.create({
                    data: {
                        userId: parentUser.id,
                        householdId: targetHousehold.id,
                        title: '🛡️ Cuenta de Niño Enlazada Automáticamente',
                        body: `${fullName} (${email}) creó una cuenta para niño y quedó enlazada bajo tu control parental.`,
                        type: 'PARENTAL_CONTROL',
                    },
                });
                await tx.auditLog.create({
                    data: {
                        userId: childUser.id,
                        householdId: targetHousehold.id,
                        action: 'CHILD_ACCOUNT_LINKED',
                        details: `Cuenta de niño creada para ${fullName} (${email}) y enlazada automáticamente al control parental de ${cleanParentEmail}`,
                    },
                });
                return {
                    childUser,
                    parentUser,
                    household: targetHousehold,
                    membership: childMembership,
                    childAccount,
                };
            });
            const { config } = await parental_control_helper_1.ParentalControlHelper.ensureChildSetup(this.prisma, {
                householdId: childResult.household.id,
                childUserId: childResult.childUser.id,
                childEmail: childResult.childUser.email,
                childName: childResult.childUser.fullName || fullName,
                memberId: childResult.membership.id,
                parentEmail: cleanParentEmail,
                parentUserId: childResult.parentUser.id,
                existingAccountId: childResult.childAccount.id,
            });
            const payload = {
                sub: childResult.childUser.id,
                email: childResult.childUser.email,
                householdId: childResult.household.id,
            };
            const token = this.jwtService.sign(payload);
            return {
                accessToken: token,
                user: {
                    id: childResult.childUser.id,
                    email: childResult.childUser.email,
                    fullName: childResult.childUser.fullName,
                    isChildAccount: true,
                    parentEmail: cleanParentEmail,
                    childAccountId: childResult.childAccount.id,
                },
                household: {
                    id: childResult.household.id,
                    name: childResult.household.name,
                    role: 'DEPENDENT',
                    isChildAccount: true,
                    parentEmail: cleanParentEmail,
                    childAccountId: childResult.childAccount.id,
                    parentalControls: config,
                },
            };
        }
        if (existingUser) {
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
            const isDep = primaryMembership?.role === 'DEPENDENT';
            const childCfg = isDep && primaryMembership
                ? await parental_control_helper_1.ParentalControlHelper.getChildConfigIfDependent(this.prisma, primaryMembership.householdId, updatedUser.id)
                : null;
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
                    isChildAccount: isDep,
                    parentEmail: childCfg?.parentEmail || null,
                    childAccountId: childCfg?.childAccountId || null,
                },
                household: primaryMembership?.household ? {
                    id: primaryMembership.household.id,
                    name: primaryMembership.household.name,
                    role: primaryMembership.role,
                    isChildAccount: isDep,
                    parentEmail: childCfg?.parentEmail || null,
                    childAccountId: childCfg?.childAccountId || null,
                    parentalControls: childCfg || null,
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
                isChildAccount: false,
            },
            household: {
                id: result.household.id,
                name: result.household.name,
                role: result.membership.role,
                isChildAccount: false,
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
        const isChildAccount = membership.role === 'DEPENDENT';
        const childConfig = isChildAccount
            ? await parental_control_helper_1.ParentalControlHelper.getChildConfigIfDependent(this.prisma, targetHouseholdId, userId)
            : null;
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
                isChildAccount,
                parentEmail: childConfig?.parentEmail || null,
                childAccountId: childConfig?.childAccountId || null,
            },
            household: {
                id: membership.household.id,
                name: membership.household.name,
                role: membership.role,
                isChildAccount,
                parentEmail: childConfig?.parentEmail || null,
                childAccountId: childConfig?.childAccountId || null,
                parentalControls: childConfig || null,
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
        const isChildAccount = currentMembership?.role === 'DEPENDENT';
        const childConfig = isChildAccount && currentMembership
            ? await parental_control_helper_1.ParentalControlHelper.getChildConfigIfDependent(this.prisma, currentMembership.householdId, user.id)
            : null;
        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                avatarUrl: user.avatarUrl,
                isChildAccount,
                parentEmail: childConfig?.parentEmail || null,
                childAccountId: childConfig?.childAccountId || null,
            },
            household: currentMembership?.household ? {
                id: currentMembership.household.id,
                name: currentMembership.household.name,
                role: currentMembership.role,
                isChildAccount,
                parentEmail: childConfig?.parentEmail || null,
                childAccountId: childConfig?.childAccountId || null,
                parentalControls: childConfig || null,
            } : null,
            availableHouseholds: isChildAccount
                ? (currentMembership?.household ? [{
                        id: currentMembership.household.id,
                        name: currentMembership.household.name,
                        role: currentMembership.role,
                        memberCount: currentMembership.household.members.length,
                    }] : [])
                : user.memberships.map(m => ({
                    id: m.household.id,
                    name: m.household.name,
                    role: m.role,
                    memberCount: m.household.members.length,
                })),
        };
    }
    async exportData(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                createdAt: true,
                memberships: {
                    include: {
                        household: {
                            include: {
                                accounts: true,
                                categories: true,
                                budgets: true,
                                debts: true,
                                subscriptions: true,
                                reminders: true,
                                assets: true,
                                allowances: true,
                            },
                        },
                    },
                },
                auditLogs: true,
                notifications: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        return {
            exportDate: new Date().toISOString(),
            format: 'HogarIQ Data Export (JSON)',
            legalNotice: 'Copia oficial de portabilidad de datos financieros personales generada por HogarIQ.',
            user,
        };
    }
    async deleteAccount(userId, passwordConfirm) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                memberships: {
                    include: {
                        household: {
                            include: {
                                members: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (user.passwordHash) {
            if (!passwordConfirm) {
                throw new common_1.BadRequestException('Debes ingresar tu contraseña actual para confirmar la baja y eliminación definitiva de tus datos.');
            }
            const isValid = this.verifyPassword(passwordConfirm, user.passwordHash);
            if (!isValid) {
                throw new common_1.UnauthorizedException('La contraseña ingresada es incorrecta.');
            }
        }
        await this.prisma.$transaction(async (tx) => {
            for (const membership of user.memberships) {
                const remainingMembersCount = membership.household.members.filter(m => m.userId !== userId).length;
                if (remainingMembersCount === 0) {
                    await tx.household.delete({
                        where: { id: membership.householdId },
                    });
                }
                else {
                    await tx.householdMember.delete({
                        where: { id: membership.id },
                    });
                }
            }
            await tx.user.delete({
                where: { id: userId },
            });
        });
        return {
            success: true,
            message: 'Tu cuenta y todos tus datos personales han sido eliminados de forma definitiva.',
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