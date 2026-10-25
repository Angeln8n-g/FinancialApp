"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PayrollSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const accounts_service_1 = require("./accounts.service");
let PayrollSchedulerService = PayrollSchedulerService_1 = class PayrollSchedulerService {
    accountsService;
    logger = new common_1.Logger(PayrollSchedulerService_1.name);
    timer = null;
    constructor(accountsService) {
        this.accountsService = accountsService;
    }
    onModuleInit() {
        this.logger.log('Iniciando PayrollSchedulerService (verificación periódica de depósitos de nómina)...');
        setTimeout(() => {
            this.checkPayroll();
        }, 10000);
        this.timer = setInterval(() => {
            this.checkPayroll();
        }, 3600000);
    }
    onModuleDestroy() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    async checkPayroll() {
        try {
            const processed = await this.accountsService.processPendingPayroll();
            if (processed > 0) {
                this.logger.log(`PayrollSchedulerService: Se procesaron ${processed} depósitos de nómina automáticamente.`);
            }
        }
        catch (err) {
            this.logger.error('Error durante la ejecución periódica de PayrollSchedulerService:', err);
        }
    }
};
exports.PayrollSchedulerService = PayrollSchedulerService;
exports.PayrollSchedulerService = PayrollSchedulerService = PayrollSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [accounts_service_1.AccountsService])
], PayrollSchedulerService);
//# sourceMappingURL=payroll-scheduler.service.js.map