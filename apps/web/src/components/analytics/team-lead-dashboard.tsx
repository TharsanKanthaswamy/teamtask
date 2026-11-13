'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Briefcase, CheckCircle, Clock, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { StatCard } from '@/components/ui/stat-card';

interface TeamLeadDashboardProps {
  teamId: string;
}

export function TeamLeadDashboard({ teamId }: TeamLeadDashboardProps) {
  const { data: analyticsData, isLoading } = useQuery<any>({
    queryKey: ['analytics-team', teamId],
    queryFn: () => api.analytics.team(teamId),
  });

  const analytics = analyticsData?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading team analytics...</div>
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

  const completionRate = analytics.summary?.totalTasksAssigned > 0
    ? Math.round((analytics.summary.totalTasksCompleted / analytics.summary.totalTasksAssigned) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Team Analytics</h2>
        <p className="text-muted-foreground">{analytics.team?.name}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Projects"
          value={analytics.progress?.activeProjects || 0}
          icon={Briefcase}
        />
        <StatCard
          title="Team Members"
          value={analytics.members?.length || 0}
          icon={Users}
        />
        <StatCard
          title="Total Tasks"
          value={analytics.summary?.totalTasksAssigned || 0}
          icon={Activity}
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={TrendingUp}
          trend={{ value: completionRate, direction: completionRate >= 50 ? 'up' : 'down' }}
        />
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tasks Completed</p>
              <p className="text-3xl font-bold">{analytics.summary?.totalTasksCompleted || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Out of {analytics.summary?.totalTasksAssigned || 0} assigned
          </p>
        </GlassCard>

        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Hours</p>
              <p className="text-3xl font-bold">{analytics.summary?.totalHoursLogged || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Logged across all projects
          </p>
        </GlassCard>

        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Project Progress</p>
              <p className="text-3xl font-bold">{analytics.progress?.averageProjectCompletion || 0}%</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Across {analytics.progress?.activeProjects || 0} projects
          </p>
        </GlassCard>
      </div>

      {/* Member Performance */}
      {analytics.members && analytics.members.length > 0 && (
        <GlassCard variant="elevated">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold">Team Member Performance</h3>
          </div>
          <div className="divide-y divide-border">
            {analytics.members.map((member: any) => {
              const memberCompletionRate = member.tasksAssigned > 0
                ? Math.round((member.tasksCompleted / member.tasksAssigned) * 100)
                : 0;

              return (
                <div key={member.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {member.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{memberCompletionRate}%</p>
                      <p className="text-xs text-muted-foreground">completion</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground mb-1">Assigned</p>
                      <p className="font-semibold">{member.tasksAssigned}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Completed</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        {member.tasksCompleted}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Hours</p>
                      <p className="font-semibold">{member.totalHours}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Average Progress</span>
                      <span className="font-medium">{member.averageProgress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${member.averageProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Project Distribution */}
      {analytics.projectDistribution && analytics.projectDistribution.length > 0 && (
        <GlassCard variant="elevated">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold">Project Distribution</h3>
          </div>
          <div className="divide-y divide-border">
            {analytics.projectDistribution.map((project: any) => (
              <div key={project.projectId} className="p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium mb-1">{project.projectName}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{project.totalTasks} tasks</span>
                      <span>{project.activeMembers} members</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{project.completionRate}%</p>
                    <p className="text-xs text-muted-foreground">complete</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.averageProgress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${project.averageProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
