import { Module } from '@nestjs/common';
import { AllowancesController } from './allowances.controller';
import { AllowancesService } from './allowances.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AllowancesController],
  providers: [AllowancesService],
  exports: [AllowancesService],
})
export class AllowancesModule {}
