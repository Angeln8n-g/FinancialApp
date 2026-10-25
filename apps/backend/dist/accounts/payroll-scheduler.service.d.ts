import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { AccountsService } from './accounts.service';
export declare class PayrollSchedulerService implements OnModuleInit, OnModuleDestroy {
    private readonly accountsService;
    private readonly logger;
    private timer;
    constructor(accountsService: AccountsService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private checkPayroll;
}
