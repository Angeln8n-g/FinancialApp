import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(@CurrentUser() user: UserPayload) {
    return this.notificationsService.getUserNotifications(user.userId);
  }

  @Put(':id/read')
  async markAsRead(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, user.userId);
  }

  @Put('read-all')
  async markAllAsRead(@CurrentUser() user: UserPayload) {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  @Post('register-token')
  async registerPushToken(@CurrentUser() user: UserPayload, @Body() body: { pushToken: string }) {
    return this.notificationsService.registerPushToken(user.userId, body.pushToken);
  }
}
