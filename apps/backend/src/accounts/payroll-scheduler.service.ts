import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { AccountsService } from './accounts.service';

@Injectable()
export class PayrollSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PayrollSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly accountsService: AccountsService) {}

  onModuleInit() {
    this.logger.log('Iniciando PayrollSchedulerService (verificación periódica de depósitos de nómina)...');

    // Ejecutar una verificación inicial tras 10 segundos de arranque del servidor
    setTimeout(() => {
      this.checkPayroll();
    }, 10000);

    // Ejecutar cada 1 hora (3600000 ms)
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

  private async checkPayroll() {
    try {
      const processed = await this.accountsService.processPendingPayroll();
      if (processed > 0) {
        this.logger.log(`PayrollSchedulerService: Se procesaron ${processed} depósitos de nómina automáticamente.`);
      }
    } catch (err) {
      this.logger.error('Error durante la ejecución periódica de PayrollSchedulerService:', err);
    }
  }
}
