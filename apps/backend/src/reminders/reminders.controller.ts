import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  async findAll(@CurrentUser() user: UserPayload) {
    return this.remindersService.findAll(user.householdId);
  }

  @Post()
  async create(
    @CurrentUser() user: UserPayload,
    @Body() body: { title: string; amount: number; dueDate: string; subscriptionId?: string; debtId?: string },
  ) {
    return this.remindersService.create(user.householdId, body);
  }

  @Put(':id/toggle')
  async togglePaid(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body?: { accountId?: string },
  ) {
    return this.remindersService.togglePaid(user.householdId, id, body?.accountId);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.remindersService.delete(user.householdId, id);
  }
}
