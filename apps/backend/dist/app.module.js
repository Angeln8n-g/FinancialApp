"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const accounts_module_1 = require("./accounts/accounts.module");
const transactions_module_1 = require("./transactions/transactions.module");
const categories_module_1 = require("./categories/categories.module");
const ai_module_1 = require("./ai/ai.module");
const household_module_1 = require("./household/household.module");
const events_module_1 = require("./events/events.module");
const reports_module_1 = require("./reports/reports.module");
const reminders_module_1 = require("./reminders/reminders.module");
const budgets_module_1 = require("./budgets/budgets.module");
const goals_module_1 = require("./goals/goals.module");
const debts_module_1 = require("./debts/debts.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const patrimony_module_1 = require("./patrimony/patrimony.module");
const notifications_module_1 = require("./notifications/notifications.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '../../.env'],
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            accounts_module_1.AccountsModule,
            transactions_module_1.TransactionsModule,
            categories_module_1.CategoriesModule,
            ai_module_1.AiModule,
            household_module_1.HouseholdModule,
            events_module_1.EventsModule,
            reports_module_1.ReportsModule,
            reminders_module_1.RemindersModule,
            budgets_module_1.BudgetsModule,
            goals_module_1.GoalsModule,
            debts_module_1.DebtsModule,
            subscriptions_module_1.SubscriptionsModule,
            patrimony_module_1.PatrimonyModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map