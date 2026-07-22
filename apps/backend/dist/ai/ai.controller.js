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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const ai_dto_1 = require("./ai.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const get_user_decorator_1 = require("../auth/get-user.decorator");
let AiController = class AiController {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    async parseNatural(dto) {
        return this.aiService.parseNaturalLanguage(dto.text);
    }
    async processOcr(dto) {
        return this.aiService.processOcr(dto.imageBase64);
    }
    async chatRAG(user, dto) {
        return this.aiService.chatRAG(user.householdId, dto.message);
    }
    async forecastWhatIf(user, body) {
        return this.aiService.forecastWhatIf(user.householdId, body.simulateExpense || 0);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('parse-natural'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_dto_1.ParseNaturalDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "parseNatural", null);
__decorate([
    (0, common_1.Post)('ocr'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_dto_1.ProcessOcrDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "processOcr", null);
__decorate([
    (0, common_1.Post)('chat'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, ai_dto_1.ChatRagDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "chatRAG", null);
__decorate([
    (0, common_1.Post)('forecast'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "forecastWhatIf", null);
exports.AiController = AiController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api/ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map