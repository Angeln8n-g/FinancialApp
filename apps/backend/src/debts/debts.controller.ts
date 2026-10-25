import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/get-user.decorator';
import { MitigationStrategy } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('api/debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get()
  async findAll(@CurrentUser() user: UserPayload) {
    return this.debtsService.findAll(user.householdId);
  }

  @Post()
  async create(
    @CurrentUser() user: UserPayload,
    @Body()
    body: {
      contactName: string;
      totalAmount: number;
      remainingAmount?: number;
      interestRate?: number;
      dueDate?: string;
      targetPayoffDate?: string;
      monthlyTargetPayment?: number;
      mitigationStrategy?: MitigationStrategy;
      notes?: string;
    },
  ) {
    return this.debtsService.create(user.householdId, body);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body()
    body: {
      contactName?: string;
      totalAmount?: number;
      remainingAmount?: number;
      interestRate?: number;
      dueDate?: string;
      targetPayoffDate?: string;
      monthlyTargetPayment?: number;
      mitigationStrategy?: MitigationStrategy;
      notes?: string;
      isPaidOff?: boolean;
    },
  ) {
    return this.debtsService.update(user.householdId, id, body);
  }

  @Post(':id/pay')
  async payDebt(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: { amount: number; accountId?: string; notes?: string },
  ) {
    return this.debtsService.payDebt(user.householdId, id, body, user.userId);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.debtsService.delete(user.householdId, id);
  }
}
