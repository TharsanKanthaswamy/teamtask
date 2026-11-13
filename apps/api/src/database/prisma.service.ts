import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Set tenant context for Row-Level Security
   * Must be called at the start of each tenant-scoped transaction
   */
  async setTenantContext(teamId: string, isSuperAdmin: boolean = false): Promise<void> {
    await this.$executeRawUnsafe(
      `SELECT set_tenant_context($1::uuid, $2::boolean)`,
      teamId,
      isSuperAdmin,
    );
  }

  /**
   * Clear tenant context (optional cleanup)
   */
  async clearTenantContext(): Promise<void> {
    await this.$executeRawUnsafe(`SELECT set_config('app.current_team_id', '', FALSE)`);
    await this.$executeRawUnsafe(`SELECT set_config('app.is_super_admin', 'FALSE', FALSE)`);
  }
}
