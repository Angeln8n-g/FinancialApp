import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionSchedulerService } from './subscription-scheduler.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionSchedulerService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
