import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { HouseholdService } from './household.service';
import { CreateChildAccountDto, InviteMemberDto, UpdateParentalControlDto, UpdateRoleDto } from './household.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/household')
export class HouseholdController {
  constructor(private readonly householdService: HouseholdService) {}

  @Get('members')
  async getMembers(@CurrentUser() user: UserPayload) {
    return this.householdService.getMembers(user.householdId);
  }

  @Post('invite')
  async inviteMember(@CurrentUser() user: UserPayload, @Body() dto: InviteMemberDto) {
    return this.householdService.inviteMember(user.userId, user.householdId, dto);
  }

  @Get('invitations')
  async getInvitations(@CurrentUser() user: UserPayload) {
    return this.householdService.getInvitations(user.householdId);
  }

  @Post('join/:code')
  async joinByCode(@CurrentUser() user: UserPayload, @Param('code') code: string) {
    return this.householdService.joinByCode(user.userId, code);
  }

  @Get('activity')
  async getActivityFeed(@CurrentUser() user: UserPayload) {
    return this.householdService.getActivityFeed(user.householdId);
  }

  @Put('members/:id/role')
  async updateRole(
    @CurrentUser() user: UserPayload,
    @Param('id') memberId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.householdService.updateRole(user.userId, user.householdId, memberId, dto);
  }

  @Put('members/:id/title')
  async updateCustomTitle(
    @CurrentUser() user: UserPayload,
    @Param('id') memberId: string,
    @Body() body: { customTitle: string },
  ) {
    return this.householdService.updateCustomTitle(user.userId, user.householdId, memberId, body.customTitle);
  }

  @Delete('members/:id')
  async removeMember(@CurrentUser() user: UserPayload, @Param('id') memberId: string) {
    return this.householdService.removeMember(user.userId, user.householdId, memberId);
  }

  @Get('split-summary')
  async getSplitSummary(@CurrentUser() user: UserPayload) {
    return this.householdService.getSplitSummary(user.householdId);
  }

  @Post('split-settle')
  async settleSplit(
    @CurrentUser() user: UserPayload,
    @Body() body?: { note?: string },
  ) {
    return this.householdService.settleSplit(user.householdId, user.userId, body?.note);
  }

  // 🛡️ ENDPOINTS DE CUENTAS DE NIÑOS & CONTROL PARENTAL

  @Get('parental-controls')
  async getParentalControls(@CurrentUser() user: UserPayload) {
    return this.householdService.getParentalControls(user.householdId, user.userId);
  }

  @Post('child-account')
  async createChildAccount(@CurrentUser() user: UserPayload, @Body() dto: CreateChildAccountDto) {
    return this.householdService.createChildAccount(user.userId, user.householdId, dto);
  }

  @Put('parental-controls/:childUserId')
  async updateParentalControl(
    @CurrentUser() user: UserPayload,
    @Param('childUserId') childUserId: string,
    @Body() dto: UpdateParentalControlDto,
  ) {
    return this.householdService.updateParentalControl(user.userId, user.householdId, childUserId, dto);
  }

  @Post('parental-controls/:childUserId/topup')
  async topUpChildAccount(
    @CurrentUser() user: UserPayload,
    @Param('childUserId') childUserId: string,
    @Body() body: { fromAccountId: string; amount: number; note?: string },
  ) {
    return this.householdService.topUpChildAccount(user.userId, user.householdId, childUserId, body);
  }
}
