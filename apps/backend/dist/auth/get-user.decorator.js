"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = exports.UserPayload = void 0;
const common_1 = require("@nestjs/common");
class UserPayload {
    userId;
    email;
    fullName;
    householdId;
    role;
}
exports.UserPayload = UserPayload;
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
//# sourceMappingURL=get-user.decorator.js.map