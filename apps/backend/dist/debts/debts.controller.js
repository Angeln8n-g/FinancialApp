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
exports.DebtsController = void 0;
const common_1 = require("@nestjs/common");
const debts_service_1 = require("./debts.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const get_user_decorator_1 = require("../auth/get-user.decorator");
let DebtsController = class DebtsController {
    debtsService;
    constructor(debtsService) {
        this.debtsService = debtsService;
    }
    async findAll(user) {
        return this.debtsService.findAll(user.householdId);
    }
    async create(user, body) {
        return this.debtsService.create(user.householdId, body);
    }
    async delete(user, id) {
        return this.debtsService.delete(user.householdId, id);
    }
};
exports.DebtsController = DebtsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload]),
    __metadata("design:returntype", Promise)
], DebtsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, Object]),
    __metadata("design:returntype", Promise)
], DebtsController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, get_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_user_decorator_1.UserPayload, String]),
    __metadata("design:returntype", Promise)
], DebtsController.prototype, "delete", null);
exports.DebtsController = DebtsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api/debts'),
    __metadata("design:paramtypes", [debts_service_1.DebtsService])
], DebtsController);
//# sourceMappingURL=debts.controller.js.map