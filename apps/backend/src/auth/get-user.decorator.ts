import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export class UserPayload {
  userId!: string;
  email!: string;
  fullName!: string;
  householdId!: string;
  role!: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
