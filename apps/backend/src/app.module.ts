import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CategoriesModule } from './categories/categories.module';
import { AiModule } from './ai/ai.module';
import { HouseholdModule } from './household/household.module';
import { EventsModule } from './events/events.module';
import { ReportsModule } from './reports/reports.module';
import { RemindersModule } from './reminders/reminders.module';
import { BudgetsModule } from './budgets/budgets.module';
import { GoalsModule } from './goals/goals.module';
import { DebtsModule } from './debts/debts.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PatrimonyModule } from './patrimony/patrimony.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    AuthModule,
    AccountsModule,
    TransactionsModule,
    CategoriesModule,
    AiModule,
    HouseholdModule,
    EventsModule,
    ReportsModule,
    RemindersModule,
    BudgetsModule,
    GoalsModule,
    DebtsModule,
    SubscriptionsModule,
    PatrimonyModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
