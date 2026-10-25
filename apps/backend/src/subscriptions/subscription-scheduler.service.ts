import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class SubscriptionSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SubscriptionSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  onModuleInit() {
    this.logger.log('Iniciando SubscriptionSchedulerService (verificación periódica de cobros de suscripciones)...');

    // Ejecutar una verificación inicial tras 15 segundos de arranque
    setTimeout(() => {
      this.checkSubscriptions();
    }, 15000);

    // Ejecutar cada 1 hora (3600000 ms)
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

  private async checkSubscriptions() {
    try {
      const processed = await this.subscriptionsService.processPendingSubscriptions();
      if (processed > 0) {
        this.logger.log(`SubscriptionSchedulerService: Se procesaron ${processed} cobros automáticos de suscripciones.`);
      }
    } catch (err) {
      this.logger.error('Error durante la verificación periódica de suscripciones:', err);
    }
  }
}
