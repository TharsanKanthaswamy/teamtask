'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Briefcase, CheckCircle, Clock, Award, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { StatCard } from '@/components/ui/stat-card';

export function SuperAdminDashboard() {
  const { data: analyticsData, isLoading } = useQuery<any>({
    queryKey: ['analytics-global'],
    queryFn: () => api.analytics.global(),
  });

  const analytics = analyticsData?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const completionRate = analytics.summary?.totalTasks > 0
    ? Math.round((analytics.summary.completedTasks / analytics.summary.totalTasks) * 100)
    : 0;

  const onTimeRate = analytics.performance?.totalCompleted > 0
    ? Math.round((analytics.performance.onTimeCompletions / analytics.performance.totalCompleted) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Global Analytics</h2>
        <p className="text-muted-foreground">Platform-wide performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Teams"
          value={analytics.summary?.totalTeams || 0}
          icon={Users}
        />
        <StatCard
          title="Active Projects"
          value={analytics.summary?.activeProjects || 0}
          icon={Briefcase}
        />
        <StatCard
          title="Total Tasks"
          value={analytics.summary?.totalTasks || 0}
          icon={CheckCircle}
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={TrendingUp}
          trend={{ value: completionRate, direction: completionRate >= 50 ? 'up' : 'down' }}
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">On-Time Completion</p>
              <p className="text-3xl font-bold">{onTimeRate}%</p>
            </div>
            <div className={`p-3 rounded-lg ${onTimeRate >= 80 ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
              <Clock className={`h-6 w-6 ${onTimeRate >= 80 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {analytics.performance?.onTimeCompletions || 0} of {analytics.performance?.totalCompleted || 0} tasks completed on time
          </p>
        </GlassCard>

        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Hours Logged</p>
              <p className="text-3xl font-bold">{analytics.summary?.totalHoursLogged || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Across all teams and projects
          </p>
        </GlassCard>

        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Team Progress</p>
              <p className="text-3xl font-bold">{analytics.progress?.averageTeamProgress || 0}%</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Average across all active teams
          </p>
        </GlassCard>
      </div>

      {/* Top Performers */}
      {analytics.topPerformers && analytics.topPerformers.length > 0 && (
        <GlassCard variant="elevated">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-lg font-semibold">Top Performers</h3>
            </div>
          </div>
          <div className="divide-y divide-border">
            {analytics.topPerformers.slice(0, 5).map((performer: any, index: number) => (
              <div key={performer.memberId} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{performer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {performer.team || 'Unknown Team'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{performer.completionRate}%</p>
                    <p className="text-xs text-muted-foreground">
                      {performer.completedTasks} tasks
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Team Comparison */}
      {analytics.teamComparison && analytics.teamComparison.length > 0 && (
        <GlassCard variant="elevated">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold">Team Comparison</h3>
          </div>
          <div className="divide-y divide-border">
            {analytics.teamComparison.map((team: any) => {
              const progressPercent = team.averageProgress || 0;
              const completionRate = team.totalTasks > 0
                ? Math.round((team.completedTasks / team.totalTasks) * 100)
                : 0;

              return (
                <div key={team.teamId} className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium mb-1">{team.teamName}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{team.activeProjects} projects</span>
                        <span>{team.totalTasks} tasks</span>
                        <span>{team.totalMembers} members</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{completionRate}%</p>
                      <p className="text-xs text-muted-foreground">completion</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Average Progress</span>
                      <span className="font-medium">{progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Issues & Alerts */}
      <GlassCard variant="elevated">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-lg font-semibold">Requires Attention</h3>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">Overdue Tasks</p>
              <p className="text-sm text-muted-foreground">Tasks past their due date</p>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {analytics.performance?.overdueTasks || 0}
            </p>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div>
              <p className="font-medium text-yellow-600 dark:text-yellow-400">Pending Reviews</p>
              <p className="text-sm text-muted-foreground">Contributions awaiting review</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {analytics.summary?.pendingReviews || 0}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
