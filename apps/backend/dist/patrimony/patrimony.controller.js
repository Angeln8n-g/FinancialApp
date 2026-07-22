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
exports.PatrimonyController = void 0;
const common_1 = require("@nestjs/common");
const patrimony_service_1 = require("./patrimony.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const get_user_decorator_1 = require("../auth/get-user.decorator");
let PatrimonyController = class PatrimonyController {
    patrimonyService;
    constructor(patrimonyService) {
        this.patrimonyService = patrimonyService;
    }
    async getNetWorth(user) {
        return this.patrimonyService.getNetWorth(user.householdId);
    }
    async createAsset(user, body) {
        return this.patrimonyService.createAsset(user.householdId, body);
    }
    async deleteAsset(user, id) {
        return this.patrimonyService.deleteAsset(user.householdId, id);
    }
};
exports.PatrimonyController = PatrimonyController;
__decorate([
    (0, common_1.Get)('net-worth'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload]),
    __metadata("design:returntype", Promise)
], PatrimonyController.prototype, "getNetWorth", null);
__decorate([
    (0, common_1.Post)('assets'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, Object]),
    __metadata("design:returntype", Promise)
], PatrimonyController.prototype, "createAsset", null);
__decorate([
    (0, common_1.Delete)('assets/:id'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, String]),
    __metadata("design:returntype", Promise)
], PatrimonyController.prototype, "deleteAsset", null);
exports.PatrimonyController = PatrimonyController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api/patrimony'),
    __metadata("design:paramtypes", [patrimony_service_1.PatrimonyService])
], PatrimonyController);
//# sourceMappingURL=patrimony.controller.js.map