import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
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

  @Get('requests')
  async getRequests(@CurrentUser() user: UserPayload) {
    return this.allowancesService.getRequests(user.householdId);
  }

  @Post(':id/request')
  async createRequest(
    @CurrentUser() user: UserPayload,
    @Param('id') allowanceId: string,
    @Body() body: { memberId: string; amount: number; reason: string },
  ) {
    return this.allowancesService.createRequest(user.householdId, body.memberId, allowanceId, body.amount, body.reason);
  }

  @Put('requests/:id')
  async respondRequest(
    @CurrentUser() user: UserPayload,
    @Param('id') requestId: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
  ) {
    return this.allowancesService.respondRequest(user.householdId, requestId, body.status);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.allowancesService.remove(id, user.householdId);
  }

  // --- 🏆 ENDPOINTS DE MISIONES Y MATCHING DE AHORRO ---

  @Get('missions')
  async getMissions(@CurrentUser() user: UserPayload) {
    return this.allowancesService.getMissions(user.householdId);
  }

  @Post('missions')
  async createMission(
    @CurrentUser() user: UserPayload,
    @Body() body: { memberId: string; title: string; rewardAmount: number; description?: string },
  ) {
    return this.allowancesService.createMission(user.householdId, body);
  }

  @Put('missions/:id/complete')
  async completeMission(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.allowancesService.completeMission(user.householdId, id, user.userId);
  }

  @Post('missions/:id/approve')
  async approveMission(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: { accountId: string },
  ) {
    return this.allowancesService.approveAndPayMission(user.householdId, id, body, user.userId);
  }

  @Delete('missions/:id')
  async deleteMission(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.allowancesService.deleteMission(user.householdId, id);
  }

  @Get('savings-matching')
  async getSavingsMatching(@CurrentUser() user: UserPayload) {
    return this.allowancesService.getSavingsMatching(user.householdId);
  }

  @Post('savings-matching')
  async updateSavingsMatching(
    @CurrentUser() user: UserPayload,
    @Body() body: { matchPercentage: number; maxMonthlyBonus: number; active: boolean },
  ) {
    return this.allowancesService.updateSavingsMatching(user.householdId, body);
  }
}
