import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  async findAll(@CurrentUser() user: UserPayload) {
    return this.subscriptionsService.findAll(user.householdId);
  }

  @Post()
  async create(
    @CurrentUser() user: UserPayload,
    @Body() body: { name: string; cost: number; nextBillingDate?: string },
  ) {
    return this.subscriptionsService.create(user.householdId, body);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: { name?: string; cost?: number },
  ) {
    return this.subscriptionsService.update(user.householdId, id, body);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.subscriptionsService.delete(user.householdId, id);
  }
}
