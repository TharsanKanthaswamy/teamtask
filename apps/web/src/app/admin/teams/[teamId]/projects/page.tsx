'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Plus, Folder, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectStatusFilter } from '@/components/projects/project-status-filter';

export default function TeamProjectsPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: team, isLoading: teamLoading } = useQuery<any>({
    queryKey: ['team', teamId],
    queryFn: () => api.teams.get(teamId),
  });

  const { data: projects, isLoading: projectsLoading, refetch } = useQuery<any>({
    queryKey: ['projects', teamId, statusFilter],
    queryFn: () => api.projects.list(teamId, statusFilter),
  });

  const { data: members } = useQuery<any>({
    queryKey: ['team-members', teamId],
    queryFn: () => api.teams.getMembers(teamId),
  });

  const handleProjectCreated = () => {
    refetch();
    setIsCreateOpen(false);
  };

  const filteredProjects = projects?.data?.filter((project: any) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (teamLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading team...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 gradient-mesh opacity-40" />

      <div className="space-y-8 p-8">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="display-text text-4xl font-semibold tracking-tight">
                {team?.data?.name} Projects
              </h1>
              <p className="body-text text-base text-muted-foreground mt-2">
                Manage and track all projects for this team
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

          {/* Search and Filter */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
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
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </GlassCard>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <GlassCard variant="elevated" className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/20">
                <Folder className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {searchQuery || statusFilter ? 'No projects found' : 'No projects yet'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {searchQuery || statusFilter
                    ? 'Try adjusting your search or filters'
                    : 'Create your first project to start organizing work for this team'}
                </p>
              </div>
              {!searchQuery && !statusFilter && (
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="button-press gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
              )}
            </div>
          </GlassCard>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project: any) => (
              <ProjectCard key={project.id} project={project} teamId={teamId} />
            ))}
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleProjectCreated}
        teamId={teamId}
        members={members?.data || []}
      />
    </div>
  );
}
