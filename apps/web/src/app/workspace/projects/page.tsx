'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Plus, Folder, Search, TrendingUp, CheckCircle2, PauseCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectStatusFilter } from '@/components/projects/project-status-filter';

export default function WorkspaceProjectsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // Get user session and team memberships
  const { data: authData, isLoading: authLoading } = useQuery<any>({
    queryKey: ['auth-verify'],
    queryFn: () => api.auth.verify(),
  });

  const { data: teamsData, isLoading: teamsLoading } = useQuery<any>({
    queryKey: ['user-teams'],
    queryFn: () => api.teams.list(),
  });

  const teams = useMemo(() => {
    return teamsData?.data || authData?.user?.teams || [];
  }, [teamsData, authData]);

  // Default to the first team if not selected
  const activeTeam = useMemo(() => {
    if (!teams || teams.length === 0) return null;
    if (selectedTeamId) {
      return teams.find((t: any) => (t.id || t.teamId) === selectedTeamId) || teams[0];
    }
    return teams[0];
  }, [teams, selectedTeamId]);

  const activeTeamId = activeTeam?.id || activeTeam?.teamId || '';
  const activeTeamName = activeTeam?.name || activeTeam?.teamName || 'Team';

  // Fetch team projects
  const { data: projectsData, isLoading: projectsLoading, refetch } = useQuery<any>({
    queryKey: ['workspace-projects', activeTeamId, statusFilter],
    queryFn: () => api.projects.list(activeTeamId, statusFilter),
    enabled: !!activeTeamId,
  });

  // Fetch team members (for create dialog)
  const { data: membersData } = useQuery<any>({
    queryKey: ['team-members', activeTeamId],
    queryFn: () => api.teams.getMembers(activeTeamId),
    enabled: !!activeTeamId,
  });

  const allProjects = projectsData?.data || [];

  const filteredProjects = allProjects.filter((project: any) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: allProjects.length,
    active: allProjects.filter((p: any) => p.status === 'ACTIVE').length,
    onHold: allProjects.filter((p: any) => p.status === 'ON_HOLD').length,
    completed: allProjects.filter((p: any) => p.status === 'COMPLETED').length,
  };

  const handleProjectCreated = () => {
    refetch();
    setIsCreateOpen(false);
  };

  if (authLoading || teamsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading workspace...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 gradient-mesh opacity-40" />

      <div className="space-y-8 p-8">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="display-text text-4xl font-semibold tracking-tight">
                  {activeTeamName} Projects
                </h1>
                {teams.length > 1 && (
                  <select
                    value={activeTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium"
                  >
                    {teams.map((team: any) => {
                      const id = team.id || team.teamId;
                      const name = team.name || team.teamName;
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
              <p className="body-text text-base text-muted-foreground mt-2">
                Manage and track all projects and deliverables for your team
              </p>
            </div>

            <Button
              onClick={() => setIsCreateOpen(true)}
              className="button-press gap-2"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Projects"
              value={stats.total}
              icon={Folder}
              loading={projectsLoading}
            />
            <StatCard
              title="Active"
              value={stats.active}
              icon={TrendingUp}
              loading={projectsLoading}
            />
            <StatCard
              title="On Hold"
              value={stats.onHold}
              icon={PauseCircle}
              loading={projectsLoading}
            />
            <StatCard
              title="Completed"
              value={stats.completed}
              icon={CheckCircle2}
              loading={projectsLoading}
            />
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ProjectStatusFilter value={statusFilter} onChange={setStatusFilter} />
          </div>
        </header>

        {/* Projects Grid */}
        {projectsLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <GlassCard key={i} variant="elevated" className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-2 bg-muted rounded w-full mt-4" />
                </div>
              </GlassCard>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <GlassCard variant="elevated" className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl glass-elevated flex items-center justify-center">
                <Folder className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight">No projects found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || statusFilter
                    ? 'No projects match your current search and filter criteria.'
                    : 'Get started by creating your first team project.'}
                </p>
              </div>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="button-press gap-2 mt-4"
              >
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            </div>
          </GlassCard>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project: any) => (
              <ProjectCard
                key={project.id}
                project={project}
                teamId={activeTeamId}
                baseHref="/workspace/projects"
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      {activeTeamId && (
        <CreateProjectDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={handleProjectCreated}
          teamId={activeTeamId}
          members={membersData?.data || []}
        />
      )}
    </div>
  );
}

