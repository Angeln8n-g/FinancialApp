import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    let retries = 10;
    while (retries > 0) {
      try {
        await this.$connect();
        this.logger.log('✓ Conectado exitosamente a PostgreSQL');
        break;
      } catch (err: any) {
        retries -= 1;
        this.logger.warn(`Esperando a que la Base de Datos esté lista... (${retries} reintentos restantes). Error: ${err.message}`);
        if (retries === 0) throw err;
        await new Promise((res) => setTimeout(res, 3000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
