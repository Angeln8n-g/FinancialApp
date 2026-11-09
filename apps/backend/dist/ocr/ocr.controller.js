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
exports.OcrController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const ocr_service_1 = require("./ocr.service");
const transactions_service_1 = require("../transactions/transactions.service");
const client_1 = require("@prisma/client");
let OcrController = class OcrController {
    ocrService;
    transactionsService;
    constructor(ocrService, transactionsService) {
        this.ocrService = ocrService;
        this.transactionsService = transactionsService;
    }
    getSamples() {
        return {
            success: true,
            samples: this.ocrService.getSampleReceipts(),
        };
    }
    async parseReceipt(req, rawText) {
        const householdId = req.user.householdId;
        const candidate = await this.ocrService.parseReceiptText(rawText, householdId);
        return {
            success: true,
            candidate,
        };
    }
    async confirmReceipt(req, dto) {
        const userId = req.user.userId || req.user.id;
        const householdId = req.user.householdId;
        let finalDesc = dto.merchantName || 'Comprobante Escaneado';
        if (dto.isShared && !finalDesc.includes('[🤝 Compartido 50/50]')) {
            finalDesc += ' [🤝 Compartido 50/50]';
        }
        if (dto.notes) {
            finalDesc += ` • ${dto.notes}`;
        }
        if (dto.lineItems && dto.lineItems.length > 0) {
            const itemsSummary = dto.lineItems.map((i) => `${i.description} ($${i.price.toFixed(2)})`).join(', ');
            finalDesc += ` [🧾 Ítems: ${itemsSummary.substring(0, 150)}]`;
        }
        const transaction = await this.transactionsService.create(householdId, {
            accountId: dto.accountId,
            categoryId: dto.categoryId || undefined,
            type: client_1.TransactionType.EXPENSE,
            amount: dto.amount,
            description: finalDesc,
            date: dto.date || new Date().toISOString(),
        }, userId);
        return {
            success: true,
            transaction,
        };
    }
};
exports.OcrController = OcrController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('samples'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OcrController.prototype, "getSamples", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('parse'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('rawText')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OcrController.prototype, "parseReceipt", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('confirm'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OcrController.prototype, "confirmReceipt", null);
exports.OcrController = OcrController = __decorate([
    (0, common_1.Controller)(['ocr', 'api/ocr']),
    __metadata("design:paramtypes", [ocr_service_1.OcrService,
        transactions_service_1.TransactionsService])
], OcrController);
//# sourceMappingURL=ocr.controller.js.map