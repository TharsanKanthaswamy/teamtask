'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { CheckSquare, LayoutGrid, List, Folder } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { TaskKanban } from '@/components/tasks/task-kanban';
import { TaskList } from '@/components/tasks/task-list';

export default function WorkspaceTasksPage() {
  const [taskView, setTaskView] = useState<'kanban' | 'list'>('kanban');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const { data: teamsData, isLoading: teamsLoading } = useQuery<any>({
    queryKey: ['user-teams'],
    queryFn: () => api.teams.list(),
  });

  const teams = teamsData?.data || [];
  const teamId = teams[0]?.id || teams[0]?.teamId || '';

  const { data: projectsData, isLoading: projectsLoading } = useQuery<any>({
    queryKey: ['workspace-projects', teamId],
    queryFn: () => api.projects.list(teamId),
    enabled: !!teamId,
  });

  const projects = projectsData?.data || [];
  const activeProjectId = selectedProjectId || (projects[0]?.id ?? '');

  if (teamsLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 gradient-mesh opacity-40" />

      <div className="space-y-6 p-8">
        <header className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="display-text text-4xl font-semibold tracking-tight">
              Tasks
            </h1>
            <p className="body-text text-base text-muted-foreground mt-2">
              Manage, assign, and track project tasks across your team
            </p>
          </div>

          <div className="flex items-center gap-3">
            {projects.length > 0 && (
              <select
                value={activeProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium"
              >
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

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
          </div>
        </header>

        {projects.length === 0 ? (
          <GlassCard variant="elevated" className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl glass-elevated flex items-center justify-center">
                <Folder className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">No projects yet</h3>
              <p className="text-sm text-muted-foreground">
                Create a project in the Projects section to start tracking and assigning tasks.
              </p>
            </div>
          </GlassCard>
        ) : activeProjectId ? (
          taskView === 'kanban' ? (
            <TaskKanban teamId={teamId} projectId={activeProjectId} />
          ) : (
            <TaskList teamId={teamId} projectId={activeProjectId} />
          )
        ) : null}
      </div>
    </div>
  );
}

