import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(
    @CurrentUser() user: UserPayload,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.getUserNotifications(
      user.userId,
      user.householdId,
      unreadOnly === 'true',
    );
  }

  @Put('read-all')
  async markAllAsRead(@CurrentUser() user: UserPayload) {
    return this.notificationsService.markAllAsRead(user.userId, user.householdId);
  }

  @Put(':id/read')
  async markAsRead(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, user.userId);
  }

  @Delete('clear-read')
  async clearReadNotifications(@CurrentUser() user: UserPayload) {
    return this.notificationsService.clearReadNotifications(user.userId, user.householdId);
  }

  @Delete('clear-all')
  async clearAllNotifications(@CurrentUser() user: UserPayload) {
    return this.notificationsService.clearAllNotifications(user.userId, user.householdId);
  }

  @Delete(':id')
  async deleteNotification(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.notificationsService.deleteNotification(id, user.userId);
  }

  @Post('register-token')
  async registerPushToken(@CurrentUser() user: UserPayload, @Body() body: { pushToken: string }) {
    return this.notificationsService.registerPushToken(user.userId, body.pushToken);
  }
}
