import { Module } from '@nestjs/common';
import { PlatformAdminController } from './platform-admin.controller';
import { PlatformAdminService } from './platform-admin.service';
import { UsersModule } from '../users/users.module';
import { TeamsModule } from '../teams/teams.module';
import { AuditModule} from '../audit/audit.module';

@Module({
  imports: [UsersModule, TeamsModule, AuditModule],
  controllers: [PlatformAdminController],
  providers: [PlatformAdminService],
})
export class PlatformAdminModule {}
