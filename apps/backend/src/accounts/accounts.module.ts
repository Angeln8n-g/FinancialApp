import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { PayrollSchedulerService } from './payroll-scheduler.service';
import { DebtsModule } from '../debts/debts.module';

@Module({
  imports: [DebtsModule],
  controllers: [AccountsController],
  providers: [AccountsService, PayrollSchedulerService],
  exports: [AccountsService],
})
export class AccountsModule {}
