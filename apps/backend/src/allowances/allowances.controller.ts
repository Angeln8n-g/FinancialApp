import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AllowancesService } from './allowances.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/get-user.decorator';
import { RecurrencePeriod } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('api/allowances')
export class AllowancesController {
  constructor(private readonly allowancesService: AllowancesService) {}

  @Get()
  async findAll(@CurrentUser() user: UserPayload) {
    return this.allowancesService.findAll(user.householdId);
  }

  @Post()
  async create(
    @CurrentUser() user: UserPayload,
    @Body() body: { memberId: string; title: string; limitAmount: number; period?: RecurrencePeriod },
  ) {
    return this.allowancesService.create(user.householdId, body);
  }

  @Post(':id/expense')
  async recordExpense(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: { amount: number },
  ) {
    return this.allowancesService.recordExpense(user.householdId, id, body.amount);
  }

  @Post(':id/disburse')
  async disburse(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: { accountId: string; amount?: number },
  ) {
    return this.allowancesService.disburse(user.householdId, id, body);
  }

  @Post(':id/reset')
  async reset(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.allowancesService.reset(user.householdId, id);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.allowancesService.remove(id, user.householdId);
  }
}
