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
exports.UpdateParentalControlDto = exports.CreateChildAccountDto = exports.UpdateRoleDto = exports.InviteMemberDto = void 0;
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class InviteMemberDto {
    email;
    role;
    parentEmail;
}
exports.InviteMemberDto = InviteMemberDto;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'El correo electrónico debe ser válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El correo electrónico es requerido' }),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Role, { message: 'El rol debe ser válido' }),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'El correo del padre o tutor debe ser válido' }),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "parentEmail", void 0);
class UpdateRoleDto {
    role;
}
exports.UpdateRoleDto = UpdateRoleDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Role, { message: 'El rol debe ser válido' }),
    __metadata("design:type", String)
], UpdateRoleDto.prototype, "role", void 0);
class CreateChildAccountDto {
    childName;
    childFullName;
    childEmail;
    childPassword;
    parentEmail;
    initialBalance;
    maxDailySpend;
    maxSingleTransaction;
    requireApprovalAbove;
    allowanceAmount;
    allowancePeriod;
}
exports.CreateChildAccountDto = CreateChildAccountDto;
__decorate([
    (0, class_validator_1.ValidateIf)((o) => !o.childFullName),
    (0, class_validator_1.IsString)({ message: 'El nombre del niño debe ser una cadena de texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre del niño es requerido' }),
    __metadata("design:type", String)
], CreateChildAccountDto.prototype, "childName", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => !o.childName),
    (0, class_validator_1.IsString)({ message: 'El nombre del niño debe ser una cadena de texto' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre del niño es requerido' }),
    __metadata("design:type", String)
], CreateChildAccountDto.prototype, "childFullName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'El correo electrónico del niño debe ser válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El correo del niño es requerido' }),
    __metadata("design:type", String)
], CreateChildAccountDto.prototype, "childEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChildAccountDto.prototype, "childPassword", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'El correo electrónico del padre o tutor debe ser válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El correo del padre o tutor con control parental es requerido' }),
    __metadata("design:type", String)
], CreateChildAccountDto.prototype, "parentEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateChildAccountDto.prototype, "initialBalance", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateChildAccountDto.prototype, "maxDailySpend", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateChildAccountDto.prototype, "maxSingleTransaction", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateChildAccountDto.prototype, "requireApprovalAbove", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateChildAccountDto.prototype, "allowanceAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.RecurrencePeriod),
    __metadata("design:type", String)
], CreateChildAccountDto.prototype, "allowancePeriod", void 0);
class UpdateParentalControlDto {
    parentEmail;
    maxDailySpend;
    maxSingleTransaction;
    requireApprovalAbove;
    isFrozen;
    allowSavingsGoals;
    blockedCategories;
}
exports.UpdateParentalControlDto = UpdateParentalControlDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'El correo del padre o tutor debe ser válido' }),
    __metadata("design:type", String)
], UpdateParentalControlDto.prototype, "parentEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateParentalControlDto.prototype, "maxDailySpend", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateParentalControlDto.prototype, "maxSingleTransaction", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateParentalControlDto.prototype, "requireApprovalAbove", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateParentalControlDto.prototype, "isFrozen", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateParentalControlDto.prototype, "allowSavingsGoals", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdateParentalControlDto.prototype, "blockedCategories", void 0);
//# sourceMappingURL=household.dto.js.map