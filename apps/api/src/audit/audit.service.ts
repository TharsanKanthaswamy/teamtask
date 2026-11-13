import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditAction } from '@prisma/client';

interface AuditLogInput {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  teamId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        teamId: input.teamId,
        metadata: input.metadata,
        ipAddress: input.ipAddress,
      },
    });
  }

  async getTeamLogs(teamId: string, limit: number = 50) {
    return this.prisma.auditLog.findMany({
      where: { teamId },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getPlatformLogs(limit: number = 100) {
    return this.prisma.auditLog.findMany({
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
