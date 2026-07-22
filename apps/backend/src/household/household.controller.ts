import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { HouseholdService } from './household.service';
import { InviteMemberDto, UpdateRoleDto } from './household.dto';
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

  @Put('members/:id/role')
  async updateRole(
    @CurrentUser() user: UserPayload,
    @Param('id') memberId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.householdService.updateRole(user.userId, user.householdId, memberId, dto);
  }
}
