import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProjectMembersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async addMember(
    projectId: string,
    teamMemberId: string,
    responsibility: string | undefined,
    adderId: string,
  ) {
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify team member exists and belongs to project's team
    const teamMember = await this.prisma.teamMember.findFirst({
      where: {
        id: teamMemberId,
        teamId: project.teamId,
        status: 'ACTIVE',
      },
      include: { user: true },
    });

    if (!teamMember) {
      throw new BadRequestException(
        'Team member must be an active member of the project\'s team',
      );
    }

    // Check if already a member
    const existing = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        teamMemberId,
      },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this project');
    }

    // Add member
    const member = await this.prisma.projectMember.create({
      data: {
        teamId: project.teamId,
        projectId,
        teamMemberId,
        responsibility,
        status: 'ACTIVE',
      },
      include: {
        teamMember: {
          include: { user: true },
        },
      },
    });

    // Log audit event
    await this.auditService.log({
      actorId: adderId,
      action: 'ADD_PROJECT_MEMBER',
      entityType: 'ProjectMember',
      entityId: member.id,
      teamId: project.teamId,
      metadata: {
        projectId,
        teamMemberId,
        userName: teamMember.user.name,
        responsibility,
      },
    });

    return member;
  }

  async removeMember(
    projectId: string,
    memberId: string,
    removerId: string,
  ): Promise<void> {
    const member = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
      include: {
        teamMember: { include: { user: true } },
        project: true,
      },
    });

    if (!member || member.projectId !== projectId) {
      throw new NotFoundException('Project member not found');
    }

    // Check if this is the project lead
    if (member.project.projectLeadId === member.teamMemberId) {
      throw new BadRequestException(
        'Cannot remove project lead. Assign a new lead first.',
      );
    }

    // Remove member
    await this.prisma.projectMember.delete({
      where: { id: memberId },
    });

    // Log audit event
    await this.auditService.log({
      actorId: removerId,
      action: 'REMOVE_PROJECT_MEMBER',
      entityType: 'ProjectMember',
      entityId: memberId,
      teamId: member.teamId,
      metadata: {
        projectId,
        teamMemberId: member.teamMemberId,
        userName: member.teamMember.user.name,
      },
    });
  }

  async getProjectMembers(projectId: string) {
    return this.prisma.projectMember.findMany({
      where: {
        projectId,
        status: 'ACTIVE',
      },
      include: {
        teamMember: {
          include: { user: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async updateMemberResponsibility(
    memberId: string,
    responsibility: string,
  ) {
    const member = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    const updated = await this.prisma.projectMember.update({
      where: { id: memberId },
      data: { responsibility },
      include: {
        teamMember: {
          include: { user: true },
        },
      },
    });

    return updated;
  }
}
