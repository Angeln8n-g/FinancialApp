import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AllowancesService } from './allowances.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/get-user.decorator';

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
    @Body() body: { memberId: string; title: string; limitAmount: number },
  ) {
    return this.allowancesService.create(user.householdId, body);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.allowancesService.remove(id, user.householdId);
  }
}
