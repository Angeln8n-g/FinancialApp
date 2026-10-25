import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionSchedulerService implements OnModuleInit, OnModuleDestroy {
    private readonly subscriptionsService;
    private readonly logger;
    private timer;
    constructor(subscriptionsService: SubscriptionsService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private checkSubscriptions;
}
