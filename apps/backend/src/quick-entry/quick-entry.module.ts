import { Module } from '@nestjs/common';
import { QuickEntryService } from './quick-entry.service';
import { QuickEntryController } from './quick-entry.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [PrismaModule, TransactionsModule],
  controllers: [QuickEntryController],
  providers: [QuickEntryService],
  exports: [QuickEntryService],
})
export class QuickEntryModule {}
