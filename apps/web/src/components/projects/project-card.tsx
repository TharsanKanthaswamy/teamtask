'use client';

import Link from 'next/link';
import { Users, Calendar, Target } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { ProjectStatusBadge } from './project-status-badge';
import { ProjectPriorityBadge } from './project-priority-badge';

interface ProjectCardProps {
  project: any;
  teamId: string;
  baseHref?: string;
}

export function ProjectCard({ project, teamId, baseHref }: ProjectCardProps) {
  const memberCount = project.members?.length || 0;
  const completedMilestones = project.milestones?.filter((m: any) => m.status === 'COMPLETED').length || 0;
  const totalMilestones = project.milestones?.length || 0;
  const linkHref = baseHref ? `${baseHref}/${project.id}` : `/admin/teams/${teamId}/projects/${project.id}`;

  return (
    <Link href={linkHref}>
      <GlassCard hover variant="elevated" className="p-6 group cursor-pointer h-full">
        <div className="space-y-4">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              <ProjectPriorityBadge priority={project.priority} />
            </div>
            <ProjectStatusBadge status={project.status} />
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
            </div>
            {totalMilestones > 0 && (
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                <span>{completedMilestones}/{totalMilestones} milestones</span>
              </div>
            )}
          </div>

          {/* Target Date */}
          {project.targetEndDate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Due {new Date(project.targetEndDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Project Lead */}
          {project.projectLead && (
            <div className="flex items-center gap-2 pt-2">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {project.projectLead.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Led by {project.projectLead.user.name}
              </span>
            </div>
          )}
        </div>
      </GlassCard>
    </Link>
  );
}
