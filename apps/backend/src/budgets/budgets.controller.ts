import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get('progress')
  async getProgress(@CurrentUser() user: UserPayload) {
    return this.budgetsService.getProgress(user.householdId);
  }

  @Post()
  async create(@CurrentUser() user: UserPayload, @Body() body: { categoryId: string; limitAmount: number }) {
    return this.budgetsService.create(user.householdId, body);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: { limitAmount: number },
  ) {
    return this.budgetsService.update(user.householdId, id, body);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.budgetsService.delete(user.householdId, id);
  }
}
