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
var SubscriptionSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const subscriptions_service_1 = require("./subscriptions.service");
let SubscriptionSchedulerService = SubscriptionSchedulerService_1 = class SubscriptionSchedulerService {
    subscriptionsService;
    logger = new common_1.Logger(SubscriptionSchedulerService_1.name);
    timer = null;
    constructor(subscriptionsService) {
        this.subscriptionsService = subscriptionsService;
    }
    onModuleInit() {
        this.logger.log('Iniciando SubscriptionSchedulerService (verificación periódica de cobros de suscripciones)...');
        setTimeout(() => {
            this.checkSubscriptions();
        }, 15000);
        this.timer = setInterval(() => {
            this.checkSubscriptions();
        }, 3600000);
    }
    onModuleDestroy() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    async checkSubscriptions() {
        try {
            const processed = await this.subscriptionsService.processPendingSubscriptions();
            if (processed > 0) {
                this.logger.log(`SubscriptionSchedulerService: Se procesaron ${processed} cobros automáticos de suscripciones.`);
            }
        }
        catch (err) {
            this.logger.error('Error durante la verificación periódica de suscripciones:', err);
        }
    }
};
exports.SubscriptionSchedulerService = SubscriptionSchedulerService;
exports.SubscriptionSchedulerService = SubscriptionSchedulerService = SubscriptionSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService])
], SubscriptionSchedulerService);
//# sourceMappingURL=subscription-scheduler.service.js.map