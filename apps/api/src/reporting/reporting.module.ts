import { Module } from '@nestjs/common';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { DatabaseModule } from '../database/database.module';
import { TenantModule } from '../tenant/tenant.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ProgressCalculationModule } from '../progress/progress-calculation.module';

@Module({
  imports: [DatabaseModule, TenantModule, AnalyticsModule, ProgressCalculationModule],
  controllers: [ReportingController],
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}
