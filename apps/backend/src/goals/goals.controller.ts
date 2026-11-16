import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  async findAll(@CurrentUser() user: UserPayload, @Query('childUserId') childUserId?: string) {
    return this.goalsService.findAll(user.householdId, user.userId, childUserId);
  }

  @Get('piggy-bank')
  async getPiggyBank(@CurrentUser() user: UserPayload, @Query('childUserId') childUserId?: string) {
    return this.goalsService.getPiggyBankSummary(user.householdId, user.userId, childUserId);
  }

  @Post('child-direct-deposit')
  async parentDirectDeposit(
    @CurrentUser() user: UserPayload,
    @Body()
    body: {
      childUserId: string;
      fromAccountId: string;
      amount: number;
      goalId?: string;
      newGoalName?: string;
      targetAmount?: number;
      emoji?: string;
      note?: string;
    },
  ) {
    return this.goalsService.parentDirectDeposit(user.householdId, user.userId, body);
  }

  @Post()
  async create(
    @CurrentUser() user: UserPayload,
    @Body()
    body: {
      name: string;
      targetAmount: number;
      currentAmount?: number;
      targetDate?: string;
      emoji?: string;
      childUserId?: string;
    },
  ) {
    return this.goalsService.create(user.householdId, body, user.userId);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: { name?: string; targetAmount?: number; targetDate?: string },
  ) {
    return this.goalsService.update(user.householdId, id, body, user.userId);
  }

  @Post(':id/contribute')
  async contribute(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: { amount: number; accountId?: string; notes?: string },
  ) {
    return this.goalsService.contribute(user.householdId, id, body, user.userId);
  }

  @Post(':id/parent-deposit')
  async parentDepositToGoal(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: { childUserId: string; fromAccountId: string; amount: number; note?: string },
  ) {
    return this.goalsService.parentDirectDeposit(user.householdId, user.userId, {
      ...body,
      goalId: id,
    });
  }

  @Delete(':id')
  async delete(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.goalsService.delete(user.householdId, id, user.userId);
  }
}
