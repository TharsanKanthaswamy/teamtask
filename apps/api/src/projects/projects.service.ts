import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createProject(teamId: string, dto: CreateProjectDto, creatorId: string) {
    // Verify team exists
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Check if slug already exists for this team
    const existing = await this.prisma.project.findFirst({
      where: { teamId, slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Project slug already exists in this team');
    }

    // Resolve project lead: either from existing team member or manual input
    let leadMemberId = dto.projectLeadId;

    if ((!leadMemberId || leadMemberId === 'OTHER') && dto.manualLeadName?.trim()) {
      const leadName = dto.manualLeadName.trim();
      const isEmail = leadName.includes('@');

      // Check if user already exists
      let user = await this.prisma.user.findFirst({
        where: isEmail
          ? { email: { equals: leadName, mode: 'insensitive' } }
          : { name: { equals: leadName, mode: 'insensitive' } },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            name: isEmail ? leadName.split('@')[0] : leadName,
            email: isEmail
              ? leadName
              : `${leadName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'lead'}@teamtrack.local`,
            passwordHash: 'manual_lead_placeholder',
            status: 'ACTIVE',
          },
        });
      }

      // Check if user is a member of this team
      let teamMember = await this.prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: user.id,
        },
      });

      if (!teamMember) {
        teamMember = await this.prisma.teamMember.create({
          data: {
            teamId,
            userId: user.id,
            role: 'TEAM_MEMBER',
            status: 'ACTIVE',
          },
        });
      }

      leadMemberId = teamMember.id;
    }

    if (!leadMemberId) {
      throw new BadRequestException('Project lead is required');
    }

    // Verify project lead is a member of this team
    const projectLead = await this.prisma.teamMember.findFirst({
      where: {
        id: leadMemberId,
        teamId,
        status: 'ACTIVE',
      },
      include: { user: true },
    });

    if (!projectLead) {
      throw new BadRequestException('Project lead must be an active member of the team');
    }

    // Verify all initial members belong to this team
    if (dto.initialMemberIds && dto.initialMemberIds.length > 0) {
      const members = await this.prisma.teamMember.findMany({
        where: {
          id: { in: dto.initialMemberIds },
          teamId,
          status: 'ACTIVE',
        },
      });

      if (members.length !== dto.initialMemberIds.length) {
        throw new BadRequestException('All project members must be active members of the team');
      }
    }

    // Create project with members in a transaction
    const project = await this.prisma.$transaction(async (tx) => {
      // Create the project
      const newProject = await tx.project.create({
        data: {
          teamId,
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          objectives: dto.objectives,
          projectLeadId: leadMemberId,
          priority: dto.priority || 'MEDIUM',
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          targetEndDate: dto.targetEndDate ? new Date(dto.targetEndDate) : null,
          createdBy: creatorId,
          status: 'PLANNING',
        },
        include: {
          projectLead: {
            include: { user: true },
          },
          team: true,
        },
      });

      // Add project lead as first member
      await tx.projectMember.create({
        data: {
          teamId,
          projectId: newProject.id,
          teamMemberId: leadMemberId,
          status: 'ACTIVE',
        },
      });

      // Add other initial members if provided
      if (dto.initialMemberIds && dto.initialMemberIds.length > 0) {
        // Filter out project lead to avoid duplicates
        const otherMemberIds = dto.initialMemberIds.filter(
          (id) => id !== leadMemberId,
        );

        if (otherMemberIds.length > 0) {
          await tx.projectMember.createMany({
            data: otherMemberIds.map((memberId) => ({
              teamId,
              projectId: newProject.id,
              teamMemberId: memberId,
              status: 'ACTIVE' as const,
            })),
          });
        }
      }

      return newProject;
    });

    // Log audit event
    await this.auditService.log({
      actorId: creatorId,
      action: 'CREATE_PROJECT',
      entityType: 'Project',
      entityId: project.id,
      teamId,
      metadata: {
        projectName: project.name,
        slug: project.slug,
        projectLeadName: projectLead.user.name,
      },
    });

    return project;
  }

  async getProjectById(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: true,
        projectLead: {
          include: { user: true },
        },
        members: {
          include: {
            teamMember: {
              include: { user: true },
            },
          },
          where: { status: 'ACTIVE' },
        },
        milestones: {
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async listTeamProjects(teamId: string, status?: ProjectStatus) {
    const where: any = {
      teamId,
      archivedAt: null,
    };

    if (status) {
      where.status = status;
    }

    return this.prisma.project.findMany({
      where,
      include: {
        projectLead: {
          include: { user: true },
        },
        members: {
          where: { status: 'ACTIVE' },
          include: {
            teamMember: {
              include: { user: true },
            },
          },
        },
        milestones: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateProject(
    projectId: string,
    dto: UpdateProjectDto,
    updaterId: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: dto.name,
        description: dto.description,
        objectives: dto.objectives,
        priority: dto.priority,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        targetEndDate: dto.targetEndDate ? new Date(dto.targetEndDate) : undefined,
        actualEndDate: dto.actualEndDate ? new Date(dto.actualEndDate) : undefined,
      },
      include: {
        projectLead: {
          include: { user: true },
        },
      },
    });

    await this.auditService.log({
      actorId: updaterId,
      action: 'UPDATE_PROJECT',
      entityType: 'Project',
      entityId: projectId,
      teamId: project.teamId,
      metadata: { updates: dto },
    });

    return updated;
  }

  async updateProjectStatus(
    projectId: string,
    status: ProjectStatus,
    updaterId: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const data: any = { status };

    // Set archivedAt when status is ARCHIVED
    if (status === 'ARCHIVED') {
      data.archivedAt = new Date();
    } else if (project.archivedAt) {
      // Clear archivedAt if moving out of archived state
      data.archivedAt = null;
    }

    // Set actualEndDate when completing or cancelling
    if ((status === 'COMPLETED' || status === 'CANCELLED') && !project.actualEndDate) {
      data.actualEndDate = new Date();
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data,
    });

    const auditAction = status === 'ARCHIVED' ? 'ARCHIVE_PROJECT' : 'UPDATE_PROJECT';

    await this.auditService.log({
      actorId: updaterId,
      action: auditAction,
      entityType: 'Project',
      entityId: projectId,
      teamId: project.teamId,
      metadata: { newStatus: status },
    });

    return updated;
  }

  async assignProjectLead(
    projectId: string,
    teamMemberId: string,
    assignerId: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify new lead is a member of the project's team
    const newLead = await this.prisma.teamMember.findFirst({
      where: {
        id: teamMemberId,
        teamId: project.teamId,
        status: 'ACTIVE',
      },
      include: { user: true },
    });

    if (!newLead) {
      throw new BadRequestException('New project lead must be an active member of the team');
    }

    await this.prisma.$transaction(async (tx) => {
      // Update project lead
      await tx.project.update({
        where: { id: projectId },
        data: { projectLeadId: teamMemberId },
      });

      // Ensure new lead is in project members
      const existingMember = await tx.projectMember.findFirst({
        where: {
          projectId,
          teamMemberId,
        },
      });

      if (!existingMember) {
        await tx.projectMember.create({
          data: {
            teamId: project.teamId,
            projectId,
            teamMemberId,
            status: 'ACTIVE',
          },
        });
      }
    });

    await this.auditService.log({
      actorId: assignerId,
      action: 'ASSIGN_PROJECT_LEAD',
      entityType: 'Project',
      entityId: projectId,
      teamId: project.teamId,
      metadata: {
        newLeadId: teamMemberId,
        newLeadName: newLead.user.name,
      },
    });

    return this.getProjectById(projectId);
  }

  async getProjectStats(teamId: string) {
    const [total, active, onHold, completed] = await Promise.all([
      this.prisma.project.count({
        where: { teamId, archivedAt: null },
      }),
      this.prisma.project.count({
        where: { teamId, status: 'ACTIVE', archivedAt: null },
      }),
      this.prisma.project.count({
        where: { teamId, status: 'ON_HOLD', archivedAt: null },
      }),
      this.prisma.project.count({
        where: { teamId, status: 'COMPLETED', archivedAt: null },
      }),
    ]);

    return {
      total,
      active,
      onHold,
      completed,
    };
  }
}
