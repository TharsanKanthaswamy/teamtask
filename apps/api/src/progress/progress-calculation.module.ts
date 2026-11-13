import { Module } from '@nestjs/common';
import { ProgressCalculationService } from './progress-calculation.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [ProgressCalculationService],
  exports: [ProgressCalculationService],
})
export class ProgressCalculationModule {}
