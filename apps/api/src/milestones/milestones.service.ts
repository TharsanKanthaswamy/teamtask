import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

@Injectable()
export class MilestonesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createMilestone(
    projectId: string,
    dto: CreateMilestoneDto,
    creatorId: string,
  ) {
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Get next sequence if not provided
    let sequence = dto.sequence ?? 0;
    if (sequence === 0) {
      const lastMilestone = await this.prisma.milestone.findFirst({
        where: { projectId },
        orderBy: { sequence: 'desc' },
      });
      sequence = lastMilestone ? lastMilestone.sequence + 1 : 0;
    }

    const milestone = await this.prisma.milestone.create({
      data: {
        teamId: project.teamId,
        projectId,
        title: dto.title,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        weight: dto.weight,
        sequence,
        status: 'NOT_STARTED',
      },
    });

    await this.auditService.log({
      actorId: creatorId,
      action: 'CREATE_MILESTONE',
      entityType: 'Milestone',
      entityId: milestone.id,
      teamId: project.teamId,
      metadata: {
        projectId,
        title: milestone.title,
      },
    });

    return milestone;
  }

  async getMilestoneById(milestoneId: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            teamId: true,
          },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    return milestone;
  }

  async listProjectMilestones(projectId: string) {
    return this.prisma.milestone.findMany({
      where: { projectId },
      orderBy: { sequence: 'asc' },
    });
  }

  async updateMilestone(
    milestoneId: string,
    dto: UpdateMilestoneDto,
    updaterId: string,
  ) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        weight: dto.weight,
        sequence: dto.sequence,
      },
    });

    await this.auditService.log({
      actorId: updaterId,
      action: 'UPDATE_MILESTONE',
      entityType: 'Milestone',
      entityId: milestoneId,
      teamId: milestone.teamId,
      metadata: {
        projectId: milestone.projectId,
        updates: dto,
      },
    });

    return updated;
  }

  async deleteMilestone(milestoneId: string, deleterId: string): Promise<void> {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    await this.prisma.milestone.delete({
      where: { id: milestoneId },
    });

    await this.auditService.log({
      actorId: deleterId,
      action: 'DELETE_MILESTONE',
      entityType: 'Milestone',
      entityId: milestoneId,
      teamId: milestone.teamId,
      metadata: {
        projectId: milestone.projectId,
        title: milestone.title,
      },
    });
  }

  async reorderMilestones(
    projectId: string,
    orderedIds: string[],
  ) {
    const milestones = await this.prisma.milestone.findMany({
      where: {
        projectId,
        id: { in: orderedIds },
      },
    });

    if (milestones.length !== orderedIds.length) {
      throw new NotFoundException('Some milestones not found');
    }

    // Update sequences in a transaction
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.milestone.update({
          where: { id },
          data: { sequence: index },
        }),
      ),
    );

    return this.listProjectMilestones(projectId);
  }
}
