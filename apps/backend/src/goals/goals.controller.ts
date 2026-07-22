import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
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

  @Delete(':id')
  async delete(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.goalsService.delete(user.householdId, id);
  }
}
