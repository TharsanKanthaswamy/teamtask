'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState, useMemo } from 'react';
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

export default function WorkspaceProjectDetailsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [taskView, setTaskView] = useState<'list' | 'kanban'>('kanban');

  // Fetch user teams to resolve team context
  const { data: teamsData, isLoading: teamsLoading } = useQuery<any>({
    queryKey: ['user-teams'],
    queryFn: () => api.teams.list(),
  });

  const teams = teamsData?.data || [];
  const teamId = teams[0]?.id || teams[0]?.teamId || '';

  const { data: project, isLoading: projectLoading, refetch } = useQuery<any>({
    queryKey: ['workspace-project', teamId, projectId],
    queryFn: () => api.projects.get(teamId, projectId),
    enabled: !!teamId && !!projectId,
  });

  const { data: members } = useQuery<any>({
    queryKey: ['project-members', teamId, projectId],
    queryFn: () => api.projectMembers.list(teamId, projectId),
    enabled: !!teamId && !!projectId,
  });

  const { data: milestones, refetch: refetchMilestones } = useQuery<any>({
    queryKey: ['milestones', teamId, projectId],
    queryFn: () => api.milestones.list(teamId, projectId),
    enabled: !!teamId && !!projectId,
  });

  const { data: activity } = useQuery<any>({
    queryKey: ['project-activity', teamId, projectId],
    queryFn: () => api.projects.getActivity(teamId, projectId),
    enabled: !!teamId && !!projectId,
  });

  const { data: tasks } = useQuery<any>({
    queryKey: ['tasks', teamId, projectId],
    queryFn: () => api.tasks.list(teamId, projectId),
    enabled: !!teamId && !!projectId,
  });

  const { data: pendingReviews } = useQuery<any>({
    queryKey: ['pending-reviews', teamId, projectId],
    queryFn: () => api.reviews.getPending(teamId, projectId),
    enabled: !!teamId && !!projectId,
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

  if (teamsLoading || projectLoading) {
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
          <Link href="/workspace/projects">
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
        <Link href="/workspace/projects">
          <Button variant="ghost" className="button-press gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </Link>

        {/* Project Header Card */}
        <GlassCard variant="elevated" className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h1 className="display-text text-3xl font-semibold tracking-tight">
                  {project.data.name}
                </h1>
                {project.data.description && (
                  <p className="body-text text-sm text-muted-foreground max-w-3xl">
                    {project.data.description}
                  </p>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <div className="flex gap-2 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <Button
                      key={tab.id}
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab(tab.id)}
                      className={`gap-2 button-press ${isActive ? 'shadow-ambient' : ''}`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className="ml-1 rounded-full bg-background/20 px-2 py-0.5 text-xs font-medium">
                          {tab.count}
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>

              {activeTab === 'tasks' && (
                <div className="flex items-center gap-1 glass-card p-1 rounded-lg">
                  <Button
                    variant={taskView === 'kanban' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTaskView('kanban')}
                    className="h-8 w-8 p-0"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={taskView === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTaskView('list')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <ProjectOverview project={project.data} teamId={teamId} onUpdate={refetch} />
          )}

          {activeTab === 'tasks' && (
            taskView === 'kanban' ? (
              <TaskKanban teamId={teamId} projectId={projectId} />
            ) : (
              <TaskList teamId={teamId} projectId={projectId} />
            )
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
              onUpdate={() => refetch()}
            />
          )}
        </div>
      </div>
    </div>
  );
}
