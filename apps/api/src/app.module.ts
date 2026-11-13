import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { PlatformAdminModule } from './platform-admin/platform-admin.module';
import { TenantModule } from './tenant/tenant.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { ProjectsModule } from './projects/projects.module';
import { ProjectMembersModule } from './project-members/project-members.module';
import { MilestonesModule } from './milestones/milestones.module';
import { TasksModule } from './tasks/tasks.module';
import { TaskAssignmentsModule } from './task-assignments/task-assignments.module';
import { ContributionsModule } from './contributions/contributions.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportingModule } from './reporting/reporting.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    MailModule,
    AuthModule,
    UsersModule,
    TeamsModule,
    PlatformAdminModule,
    TenantModule,
    AuditModule,
    HealthModule,
    ProjectsModule,
    ProjectMembersModule,
    MilestonesModule,
    TasksModule,
    TaskAssignmentsModule,
    ContributionsModule,
    ReviewsModule,
    NotificationsModule,
    AnalyticsModule,
    ReportingModule,
  ],
})
export class AppModule {}
