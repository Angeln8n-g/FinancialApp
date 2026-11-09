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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickEntryController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const quick_entry_service_1 = require("./quick-entry.service");
let QuickEntryController = class QuickEntryController {
    quickEntryService;
    constructor(quickEntryService) {
        this.quickEntryService = quickEntryService;
    }
    async parse(req, text) {
        const householdId = req.user.householdId;
        const candidate = await this.quickEntryService.parseText(text, householdId);
        return { success: true, candidate };
    }
    async submit(req, text) {
        const userId = req.user.userId || req.user.id;
        const householdId = req.user.householdId;
        return this.quickEntryService.executeQuickEntry(userId, householdId, text);
    }
    async getTelegramLink(req) {
        const userId = req.user.userId || req.user.id;
        const householdId = req.user.householdId;
        const fullName = req.user.fullName || 'Usuario HogarIQ';
        const rawToken = `${userId}:${householdId}`;
        const token = Buffer.from(rawToken, 'utf8').toString('base64');
        const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'HogarIQBot';
        const webhookUrl = process.env.PUBLIC_API_URL
            ? `${process.env.PUBLIC_API_URL}/api/quick-entry/telegram-webhook`
            : 'https://api-hogariq.kasino21.com/api/quick-entry/telegram-webhook';
        const deepLink = `https://t.me/${botUsername}?start=${token}`;
        return {
            success: true,
            botUsername,
            token,
            deepLink,
            webhookUrl,
            instructions: `Envía /start ${token} a @${botUsername} o haz clic en el enlace para vincularte en 1 segundo.`,
        };
    }
    async setupTelegramBot(botToken) {
        if (!botToken || typeof botToken !== 'string') {
            return { success: false, message: 'Token de bot requerido' };
        }
        const cleanToken = botToken.trim();
        const webhookUrl = process.env.PUBLIC_API_URL
            ? `${process.env.PUBLIC_API_URL}/api/quick-entry/telegram-webhook`
            : 'https://api-hogariq.kasino21.com/api/quick-entry/telegram-webhook';
        try {
            const meRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
            const meData = await meRes.json();
            if (!meData.ok) {
                return { success: false, message: `Token inválido de Telegram: ${meData.description || 'Error desconocido'}` };
            }
            const hookRes = await fetch(`https://api.telegram.org/bot${cleanToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
            const hookData = await hookRes.json();
            if (!hookData.ok) {
                return { success: false, message: `Error configurando webhook: ${hookData.description}` };
            }
            const botUsername = meData.result?.username;
            process.env.TELEGRAM_BOT_USERNAME = botUsername;
            return {
                success: true,
                botUsername,
                message: `Webhook configurado exitosamente para @${botUsername}`,
            };
        }
        catch (err) {
            return { success: false, message: `Error conectando con la API de Telegram: ${err.message}` };
        }
    }
    async telegramWebhook(body) {
        return this.quickEntryService.handleTelegramWebhook(body);
    }
};
exports.QuickEntryController = QuickEntryController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('parse'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('text')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], QuickEntryController.prototype, "parse", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('submit'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('text')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], QuickEntryController.prototype, "submit", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('telegram-link'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuickEntryController.prototype, "getTelegramLink", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('setup-telegram-bot'),
    __param(0, (0, common_1.Body)('botToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuickEntryController.prototype, "setupTelegramBot", null);
__decorate([
    (0, common_1.Post)('telegram-webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuickEntryController.prototype, "telegramWebhook", null);
exports.QuickEntryController = QuickEntryController = __decorate([
    (0, common_1.Controller)('quick-entry'),
    __metadata("design:paramtypes", [quick_entry_service_1.QuickEntryService])
], QuickEntryController);
//# sourceMappingURL=quick-entry.controller.js.map