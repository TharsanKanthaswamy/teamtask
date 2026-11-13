'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { Folder, Search, TrendingUp, Clock, CheckCircle2, PauseCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { StatCard } from '@/components/ui/stat-card';
import { Input } from '@/components/ui/input';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectStatusFilter } from '@/components/projects/project-status-filter';

export default function AllProjectsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all teams (Super Admin can see all)
  const { data: teams } = useQuery<any>({
    queryKey: ['teams'],
    queryFn: () => api.teams.list(),
  });

  // Fetch projects for each team
  const teamIds = teams?.data?.map((team: any) => team.id) || [];

  const projectQueries = useQuery<any>({
    queryKey: ['all-projects', teamIds, statusFilter],
    queryFn: async () => {
      if (teamIds.length === 0) return [];

      const projectsPromises = teamIds.map((teamId: string) =>
        api.projects.list(teamId, statusFilter)
      );

      const results = await Promise.all(projectsPromises);
      return results.flatMap((result, index) =>
        (result.data || []).map((project: any) => ({
          ...project,
          teamId: teamIds[index],
        }))
      );
    },
    enabled: teamIds.length > 0,
  });

  const allProjects = projectQueries.data || [];

  const filteredProjects = allProjects.filter((project: any) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.team?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: allProjects.length,
    active: allProjects.filter((p: any) => p.status === 'ACTIVE').length,
    onHold: allProjects.filter((p: any) => p.status === 'ON_HOLD').length,
    completed: allProjects.filter((p: any) => p.status === 'COMPLETED').length,
  };

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 gradient-mesh opacity-40" />

      <div className="space-y-8 p-8">
        {/* Header */}
        <header className="space-y-3">
          <h1 className="display-text text-4xl font-semibold tracking-tight">
            All Projects
          </h1>
          <p className="body-text text-base text-muted-foreground max-w-2xl">
            Overview of all projects across all teams
          </p>
        </header>

        {/* Stats */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Projects"
            value={stats.total}
            icon={Folder}
            loading={projectQueries.isLoading}
          />
          <StatCard
            title="Active"
            value={stats.active}
            icon={TrendingUp}
            loading={projectQueries.isLoading}
          />
          <StatCard
            title="On Hold"
            value={stats.onHold}
            icon={PauseCircle}
            loading={projectQueries.isLoading}
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle2}
            loading={projectQueries.isLoading}
          />
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

        {/* Projects Grid */}
        {projectQueries.isLoading ? (
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
                    : 'Projects will appear here once teams create them'}
                </p>
              </div>
            </div>
          </GlassCard>
        ) : (
          <div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project: any) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  teamId={project.teamId}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
