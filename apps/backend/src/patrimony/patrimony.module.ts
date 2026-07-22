import { Module } from '@nestjs/common';
import { PatrimonyService } from './patrimony.service';
import { PatrimonyController } from './patrimony.controller';

@Module({
  controllers: [PatrimonyController],
  providers: [PatrimonyService],
  exports: [PatrimonyService],
})
export class PatrimonyModule {}
