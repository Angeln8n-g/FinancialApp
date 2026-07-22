import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/get-user.decorator';

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
    @Body() body: { contactName: string; totalAmount: number; remainingAmount: number; interestRate?: number },
  ) {
    return this.debtsService.create(user.householdId, body);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.debtsService.delete(user.householdId, id);
  }
}
