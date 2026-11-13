import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsActivityController } from './projects-activity.controller';
import { ProjectsService } from './projects.service';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [DatabaseModule, AuditModule, TenantModule],
  controllers: [ProjectsController, ProjectsActivityController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
