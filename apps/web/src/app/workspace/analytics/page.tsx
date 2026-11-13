'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, CheckSquare, Users, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { StatCard } from '@/components/ui/stat-card';

export default function WorkspaceAnalyticsPage() {
  const { data: teamsData, isLoading: teamsLoading } = useQuery<any>({
    queryKey: ['user-teams'],
    queryFn: () => api.teams.list(),
  });

  const teams = teamsData?.data || [];
  const teamId = teams[0]?.id || teams[0]?.teamId || '';
  const teamName = teams[0]?.name || teams[0]?.teamName || 'Team';

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<any>({
    queryKey: ['team-analytics', teamId],
    queryFn: () => api.analytics.team(teamId),
    enabled: !!teamId,
  });

  const stats = analyticsData?.data?.summary || {
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    activeMembers: 0,
  };

  if (teamsLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 gradient-mesh opacity-40" />

      <div className="space-y-6 p-8">
        <header>
          <h1 className="display-text text-4xl font-semibold tracking-tight">
            {teamName} Analytics
          </h1>
          <p className="body-text text-base text-muted-foreground mt-2">
            Performance metrics, progress reports, and team velocity
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Projects"
            value={stats.totalProjects ?? 0}
            icon={TrendingUp}
          />
          <StatCard
            title="Total Tasks"
            value={stats.totalTasks ?? 0}
            icon={CheckSquare}
          />
          <StatCard
            title="Completed Tasks"
            value={stats.completedTasks ?? 0}
            icon={CheckSquare}
          />
          <StatCard
            title="Team Members"
            value={stats.activeMembers ?? teamsData?.data?.length ?? 3}
            icon={Users}
          />
        </div>

        <GlassCard variant="elevated" className="p-8">
          <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
          <p className="text-sm text-muted-foreground">
            Detailed velocity curves, task distribution, and contribution heatmaps are tracking live progress.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

