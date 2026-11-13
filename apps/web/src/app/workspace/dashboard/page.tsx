'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { FolderKanban, CheckSquare, Users, TrendingUp, ArrowRight, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/projects/project-card';

export default function WorkspaceDashboardPage() {
  const { data: teamsData, isLoading: teamsLoading } = useQuery<any>({
    queryKey: ['user-teams'],
    queryFn: () => api.teams.list(),
  });

  const teams = teamsData?.data || [];
  const teamId = teams[0]?.id || teams[0]?.teamId || '';
  const teamName = teams[0]?.name || teams[0]?.teamName || 'Team';

  const { data: projectsData, isLoading: projectsLoading } = useQuery<any>({
    queryKey: ['workspace-projects', teamId],
    queryFn: () => api.projects.list(teamId),
    enabled: !!teamId,
  });

  const { data: membersData } = useQuery<any>({
    queryKey: ['team-members', teamId],
    queryFn: () => api.teams.getMembers(teamId),
    enabled: !!teamId,
  });

  const projects = projectsData?.data || [];
  const members = membersData?.data || [];
  const activeProjects = projects.filter((p: any) => p.status === 'ACTIVE');

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 gradient-mesh opacity-40" />

      <div className="space-y-8 p-8">
        {/* Welcome Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="display-text text-4xl font-semibold tracking-tight">
              {teamName} Dashboard
            </h1>
            <p className="body-text text-base text-muted-foreground mt-2">
              Overview of active projects, assigned tasks, and team progress
            </p>
          </div>

          <Link href="/workspace/projects">
            <Button className="button-press gap-2">
              <FolderKanban className="h-4 w-4" />
              View Projects
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Projects"
            value={projects.length}
            icon={FolderKanban}
            loading={projectsLoading}
          />
          <StatCard
            title="Active Projects"
            value={activeProjects.length}
            icon={TrendingUp}
            loading={projectsLoading}
          />
          <StatCard
            title="Team Members"
            value={members.length || 3}
            icon={Users}
            loading={teamsLoading}
          />
          <StatCard
            title="Completion Rate"
            value={
              projects.length > 0
                ? `${Math.round((projects.filter((p: any) => p.status === 'COMPLETED').length / projects.length) * 100)}%`
                : '100%'
            }
            icon={CheckSquare}
            loading={projectsLoading}
          />
        </div>

        {/* Active Projects Showcase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Active Projects</h2>
            <Link
              href="/workspace/projects"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              All Projects <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {projectsLoading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <GlassCard key={i} variant="elevated" className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <GlassCard variant="elevated" className="p-8 text-center space-y-3">
              <p className="text-muted-foreground text-sm">
                No projects created yet for {teamName}.
              </p>
              <Link href="/workspace/projects">
                <Button variant="ghost" className="button-press gap-2">
                  <Plus className="h-4 w-4" />
                  Go to Projects
                </Button>
              </Link>
            </GlassCard>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 6).map((project: any) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  teamId={teamId}
                  baseHref="/workspace/projects"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
