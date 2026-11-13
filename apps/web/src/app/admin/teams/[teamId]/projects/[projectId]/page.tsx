'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Users, Target, Activity, Settings, CheckSquare, LayoutGrid, List, ClipboardCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { ProjectOverview } from '@/components/projects/project-overview';
import { ProjectMembers } from '@/components/projects/project-members';
import { ProjectMilestones } from '@/components/projects/project-milestones';
import { ProjectActivity } from '@/components/projects/project-activity';
import { ProjectSettings } from '@/components/projects/project-settings';
import { TaskList } from '@/components/tasks/task-list';
import { TaskKanban } from '@/components/tasks/task-kanban';
import { ReviewQueue } from '@/components/reviews/review-queue';

type TabType = 'overview' | 'tasks' | 'reviews' | 'members' | 'milestones' | 'activity' | 'settings';

export default function ProjectDetailsPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const projectId = params.projectId as string;
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [taskView, setTaskView] = useState<'list' | 'kanban'>('kanban');

  const { data: project, isLoading, refetch } = useQuery<any>({
    queryKey: ['project', teamId, projectId],
    queryFn: () => api.projects.get(teamId, projectId),
  });

  const { data: members } = useQuery<any>({
    queryKey: ['project-members', teamId, projectId],
    queryFn: () => api.projectMembers.list(teamId, projectId),
  });

  const { data: milestones, refetch: refetchMilestones } = useQuery<any>({
    queryKey: ['milestones', teamId, projectId],
    queryFn: () => api.milestones.list(teamId, projectId),
  });

  const { data: activity } = useQuery<any>({
    queryKey: ['project-activity', teamId, projectId],
    queryFn: () => api.projects.getActivity(teamId, projectId),
  });

  const { data: tasks } = useQuery<any>({
    queryKey: ['tasks', teamId, projectId],
    queryFn: () => api.tasks.list(teamId, projectId),
  });

  const { data: pendingReviews } = useQuery<any>({
    queryKey: ['pending-reviews', teamId, projectId],
    queryFn: () => api.reviews.getPending(teamId, projectId),
  });

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Target },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare, count: tasks?.data?.length },
    { id: 'reviews' as const, label: 'Reviews', icon: ClipboardCheck, count: pendingReviews?.data?.length },
    { id: 'members' as const, label: 'Members', icon: Users, count: members?.data?.length },
    { id: 'milestones' as const, label: 'Milestones', icon: Target, count: milestones?.data?.length },
    { id: 'activity' as const, label: 'Activity', icon: Activity },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  if (!project?.data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <h3 className="text-lg font-semibold">Project not found</h3>
          <Link href={`/admin/teams/${teamId}/projects`}>
            <Button variant="ghost">Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 gradient-mesh opacity-40" />

      <div className="space-y-6 p-8">
        {/* Back Button */}
        <Link href={`/admin/teams/${teamId}/projects`}>
          <Button variant="ghost" className="button-press gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </Link>

        {/* Header */}
        <header className="space-y-2">
          <h1 className="display-text text-4xl font-semibold tracking-tight">
            {project.data.name}
          </h1>
          {project.data.description && (
            <p className="body-text text-base text-muted-foreground max-w-3xl">
              {project.data.description}
            </p>
          )}
        </header>

        {/* Tabs */}
        <GlassCard variant="elevated" className="p-1">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200 whitespace-nowrap button-press
                    ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={`
                        px-1.5 py-0.5 rounded-md text-xs font-medium
                        ${
                          isActive
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }
                      `}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <ProjectOverview project={project.data} teamId={teamId} onUpdate={refetch} />
          )}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {/* View Toggle */}
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                  <button
                    onClick={() => setTaskView('kanban')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      taskView === 'kanban'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Board
                  </button>
                  <button
                    onClick={() => setTaskView('list')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      taskView === 'list'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <List className="h-4 w-4" />
                    List
                  </button>
                </div>
              </div>

              {/* Task Views */}
              {taskView === 'kanban' ? (
                <TaskKanban teamId={teamId} projectId={projectId} />
              ) : (
                <TaskList teamId={teamId} projectId={projectId} />
              )}
            </div>
          )}
          {activeTab === 'reviews' && (
            <ReviewQueue teamId={teamId} projectId={projectId} />
          )}
          {activeTab === 'members' && (
            <ProjectMembers
              teamId={teamId}
              projectId={projectId}
              members={members?.data || []}
              project={project.data}
              onUpdate={refetch}
            />
          )}
          {activeTab === 'milestones' && (
            <ProjectMilestones
              teamId={teamId}
              projectId={projectId}
              milestones={milestones?.data || []}
              onUpdate={refetchMilestones}
            />
          )}
          {activeTab === 'activity' && (
            <ProjectActivity activity={activity?.data || []} />
          )}
          {activeTab === 'settings' && (
            <ProjectSettings
              project={project.data}
              teamId={teamId}
              onUpdate={refetch}
            />
          )}
        </div>
      </div>
    </div>
  );
}
