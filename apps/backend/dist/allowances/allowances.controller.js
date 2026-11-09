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
exports.AllowancesController = void 0;
const common_1 = require("@nestjs/common");
const allowances_service_1 = require("./allowances.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const get_user_decorator_1 = require("../auth/get-user.decorator");
let AllowancesController = class AllowancesController {
    allowancesService;
    constructor(allowancesService) {
        this.allowancesService = allowancesService;
    }
    async findAll(user) {
        return this.allowancesService.findAll(user.householdId);
    }
    async create(user, body) {
        return this.allowancesService.create(user.householdId, body);
    }
    async recordExpense(user, id, body) {
        return this.allowancesService.recordExpense(user.householdId, id, body.amount);
    }
    async disburse(user, id, body) {
        return this.allowancesService.disburse(user.householdId, id, body);
    }
    async reset(user, id) {
        return this.allowancesService.reset(user.householdId, id);
    }
    async getRequests(user) {
        return this.allowancesService.getRequests(user.householdId);
    }
    async createRequest(user, allowanceId, body) {
        return this.allowancesService.createRequest(user.householdId, body.memberId, allowanceId, body.amount, body.reason);
    }
    async respondRequest(user, requestId, body) {
        return this.allowancesService.respondRequest(user.householdId, requestId, body.status);
    }
    async remove(user, id) {
        return this.allowancesService.remove(id, user.householdId);
    }
    async getMissions(user) {
        return this.allowancesService.getMissions(user.householdId);
    }
    async createMission(user, body) {
        return this.allowancesService.createMission(user.householdId, body);
    }
    async completeMission(user, id) {
        return this.allowancesService.completeMission(user.householdId, id, user.userId);
    }
    async approveMission(user, id, body) {
        return this.allowancesService.approveAndPayMission(user.householdId, id, body, user.userId);
    }
    async deleteMission(user, id) {
        return this.allowancesService.deleteMission(user.householdId, id);
    }
    async getSavingsMatching(user) {
        return this.allowancesService.getSavingsMatching(user.householdId);
    }
    async updateSavingsMatching(user, body) {
        return this.allowancesService.updateSavingsMatching(user.householdId, body);
    }
};
exports.AllowancesController = AllowancesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload]),
    __metadata("design:returntype", Promise)
], AllowancesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, Object]),
    __metadata("design:returntype", Promise)
], AllowancesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/expense'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, String, Object]),
    __metadata("design:returntype", Promise)
], AllowancesController.prototype, "recordExpense", null);
__decorate([
    (0, common_1.Post)(':id/disburse'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, String, Object]),
    __metadata("design:returntype", Promise)
], AllowancesController.prototype, "disburse", null);
__decorate([
    (0, common_1.Post)(':id/reset'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, String]),
    __metadata("design:returntype", Promise)
], AllowancesController.prototype, "reset", null);
__decorate([
    (0, common_1.Get)('requests'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload]),
    __metadata("design:returntype", Promise)
], AllowancesController.prototype, "getRequests", null);
__decorate([
    (0, common_1.Post)(':id/request'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, String, Object]),
    __metadata("design:returntype", Promise)
], AllowancesController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Put)('requests/:id'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, String, Object]),
    __metadata("design:returntype", Promise)
], AllowancesController.prototype, "respondRequest", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, String]),
    __metadata("design:returntype", Promise)
], AllowancesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('missions'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload]),
    __metadata("design:returntype", Promise)
], AllowancesController.prototype, "getMissions", null);
__decorate([
    (0, common_1.Post)('missions'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, Object]),
    __metadata("design:returntype", Promise)
], AllowancesController.prototype, "createMission", null);
__decorate([
    (0, common_1.Put)('missions/:id/complete'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, String]),
    __metadata("design:returntype", Promise)
], AllowancesController.prototype, "completeMission", null);
__decorate([
    (0, common_1.Post)('missions/:id/approve'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, String, Object]),
    __metadata("design:returntype", Promise)
], AllowancesController.prototype, "approveMission", null);
__decorate([
    (0, common_1.Delete)('missions/:id'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, String]),
    __metadata("design:returntype", Promise)
], AllowancesController.prototype, "deleteMission", null);
__decorate([
    (0, common_1.Get)('savings-matching'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload]),
    __metadata("design:returntype", Promise)
], AllowancesController.prototype, "getSavingsMatching", null);
__decorate([
    (0, common_1.Post)('savings-matching'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, Object]),
    __metadata("design:returntype", Promise)
], AllowancesController.prototype, "updateSavingsMatching", null);
exports.AllowancesController = AllowancesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api/allowances'),
    __metadata("design:paramtypes", [allowances_service_1.AllowancesService])
], AllowancesController);
//# sourceMappingURL=allowances.controller.js.map