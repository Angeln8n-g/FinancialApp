import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  async findAll(@CurrentUser() user: UserPayload) {
    return this.goalsService.findAll(user.householdId);
  }

  @Post()
  async create(
    @CurrentUser() user: UserPayload,
    @Body() body: { name: string; targetAmount: number; currentAmount?: number; targetDate?: string },
  ) {
    return this.goalsService.create(user.householdId, body);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: { name?: string; targetAmount?: number; targetDate?: string },
  ) {
    return this.goalsService.update(user.householdId, id, body);
  }

  @Post(':id/contribute')
  async contribute(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: { amount: number; accountId?: string; notes?: string },
  ) {
    return this.goalsService.contribute(user.householdId, id, body, user.userId);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.goalsService.delete(user.householdId, id);
  }
}
