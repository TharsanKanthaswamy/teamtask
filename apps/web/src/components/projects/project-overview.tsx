'use client';

import { Users, Calendar, Target, Flag } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { ProjectStatusBadge } from './project-status-badge';
import { ProjectPriorityBadge } from './project-priority-badge';

interface ProjectOverviewProps {
  project: any;
  teamId: string;
  onUpdate: () => void;
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const stats = [
    {
      label: 'Team Members',
      value: project.members?.length || 0,
      icon: Users,
    },
    {
      label: 'Milestones',
      value: project.milestones?.length || 0,
      icon: Target,
    },
    {
      label: 'Completed Milestones',
      value: project.milestones?.filter((m: any) => m.status === 'COMPLETED').length || 0,
      icon: Flag,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Status and Priority */}
      <GlassCard variant="elevated" className="p-6">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Status</p>
            <ProjectStatusBadge status={project.status} />
          </div>
          <div className="h-12 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground mb-2">Priority</p>
            <div className="flex items-center gap-2">
              <ProjectPriorityBadge priority={project.priority} />
              <span className="text-sm font-medium">{project.priority}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid gap-5 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.label} variant="elevated" className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-semibold stat-number tabular-nums">
                    {stat.value}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Lead */}
        <GlassCard variant="elevated" className="p-6">
          <h3 className="text-lg font-semibold mb-4">Project Lead</h3>
          {project.projectLead && (
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-medium text-primary">
                  {project.projectLead.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{project.projectLead.user.name}</p>
                <p className="text-sm text-muted-foreground">{project.projectLead.user.email}</p>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Dates */}
        <GlassCard variant="elevated" className="p-6">
          <h3 className="text-lg font-semibold mb-4">Timeline</h3>
          <div className="space-y-3">
            {project.startDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Start:</span>
                <span className="font-medium">
                  {new Date(project.startDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
            {project.targetEndDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Target:</span>
                <span className="font-medium">
                  {new Date(project.targetEndDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
            {project.actualEndDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Completed:</span>
                <span className="font-medium">
                  {new Date(project.actualEndDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Objectives */}
      {project.objectives && (
        <GlassCard variant="elevated" className="p-6">
          <h3 className="text-lg font-semibold mb-4">Objectives</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {project.objectives}
          </p>
        </GlassCard>
      )}

      {/* Team */}
      {project.team && (
        <GlassCard variant="elevated" className="p-6">
          <h3 className="text-lg font-semibold mb-4">Team</h3>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">{project.team.name}</p>
              <p className="text-sm text-muted-foreground">{project.team.description || 'No description'}</p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
