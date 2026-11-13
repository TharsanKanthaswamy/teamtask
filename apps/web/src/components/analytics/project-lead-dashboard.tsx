'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, CheckCircle, Clock, AlertCircle, Target } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { StatCard } from '@/components/ui/stat-card';

interface ProjectLeadDashboardProps {
  projectId: string;
}

export function ProjectLeadDashboard({ projectId }: ProjectLeadDashboardProps) {
  const { data: analyticsData, isLoading } = useQuery<any>({
    queryKey: ['analytics-project', projectId],
    queryFn: () => api.analytics.project(projectId),
  });

  const analytics = analyticsData?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading project analytics...</div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Project Analytics</h2>
        <p className="text-muted-foreground">{analytics.project?.name}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={analytics.progress?.totalTasks || 0}
          icon={Target}
        />
        <StatCard
          title="Completed"
          value={analytics.progress?.completedTasks || 0}
          icon={CheckCircle}
        />
        <StatCard
          title="Contributors"
          value={analytics.contributors?.length || 0}
          icon={Users}
        />
        <StatCard
          title="Reported Progress"
          value={`${analytics.progress?.reportedProgress || 0}%`}
          icon={TrendingUp}
          trend={{
            value: analytics.progress?.reportedProgress || 0,
            direction: (analytics.progress?.reportedProgress || 0) >= 50 ? 'up' : 'down',
          }}
        />
      </div>

      {/* Progress Overview */}
      <GlassCard variant="elevated" className="p-6">
        <h3 className="text-lg font-semibold mb-6">Progress Overview</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Reported Progress</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {analytics.progress?.reportedProgress || 0}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${analytics.progress?.reportedProgress || 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Progress reported by team members
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Approved Progress</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {analytics.progress?.approvedProgress || 0}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${analytics.progress?.approvedProgress || 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Progress approved by project lead
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Task Breakdown */}
      {analytics.taskBreakdown && (
        <GlassCard variant="elevated" className="p-6">
          <h3 className="text-lg font-semibold mb-6">Task Status Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-slate-500/10">
              <p className="text-3xl font-bold mb-1">{analytics.taskBreakdown.BACKLOG || 0}</p>
              <p className="text-sm text-muted-foreground">Backlog</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-500/10">
              <p className="text-3xl font-bold mb-1">{analytics.taskBreakdown.TODO || 0}</p>
              <p className="text-sm text-muted-foreground">To Do</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-500/10">
              <p className="text-3xl font-bold mb-1">{analytics.taskBreakdown.IN_PROGRESS || 0}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-500/10">
              <p className="text-3xl font-bold mb-1">{analytics.taskBreakdown.COMPLETED || 0}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Contributors */}
      {analytics.contributors && analytics.contributors.length > 0 && (
        <GlassCard variant="elevated">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold">Contributor Overview</h3>
          </div>
          <div className="divide-y divide-border">
            {analytics.contributors.map((contributor: any) => (
              <div key={contributor.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {contributor.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contributor.name}</p>
                      <p className="text-sm text-muted-foreground">{contributor.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Progress</p>
                    <p className="text-lg font-bold">{contributor.approvedCompletion}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Tasks Assigned</p>
                    <p className="font-semibold">{contributor.tasksAssigned}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Reported Progress</p>
                    <p className="font-semibold">{contributor.reportedCompletion}%</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Contribution</span>
                    <span className="font-medium">{contributor.approvedCompletion}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${contributor.approvedCompletion}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Deadlines & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tasks In Review</p>
              <p className="text-3xl font-bold">{analytics.taskBreakdown?.IN_REVIEW || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Awaiting your review
          </p>
        </GlassCard>

        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Blocked Tasks</p>
              <p className="text-3xl font-bold">{analytics.taskBreakdown?.BLOCKED || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Requires immediate attention
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
