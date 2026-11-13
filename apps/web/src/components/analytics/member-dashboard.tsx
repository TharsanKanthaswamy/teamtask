'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, CheckCircle, Clock, Award, Target, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { StatCard } from '@/components/ui/stat-card';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';

export function MemberDashboard() {
  const { data: analyticsData, isLoading } = useQuery<any>({
    queryKey: ['analytics-me'],
    queryFn: () => api.analytics.me(),
  });

  const analytics = analyticsData?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading your analytics...</div>
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

  const completionRate = analytics.overallStatistics?.totalTasks > 0
    ? Math.round((analytics.overallStatistics.completedTasks / analytics.overallStatistics.totalTasks) * 100)
    : 0;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const now = new Date();
    const isOverdue = date < now;
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return { formatted, isOverdue };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">My Performance</h2>
        <p className="text-muted-foreground">Your personal analytics and active tasks</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={analytics.overallStatistics?.totalTasks || 0}
          icon={Target}
        />
        <StatCard
          title="Completed"
          value={analytics.overallStatistics?.completedTasks || 0}
          icon={CheckCircle}
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={TrendingUp}
          trend={{ value: completionRate, direction: completionRate >= 50 ? 'up' : 'down' }}
        />
        <StatCard
          title="Total Hours"
          value={analytics.overallStatistics?.totalHoursLogged || 0}
          icon={Clock}
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">On-Time Rate</p>
              <p className="text-3xl font-bold">{analytics.performance?.onTimeRate || 0}%</p>
            </div>
            <div className={`p-3 rounded-lg ${analytics.performance?.onTimeRate >= 80 ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
              <Award className={`h-6 w-6 ${analytics.performance?.onTimeRate >= 80 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Tasks completed by deadline
          </p>
        </GlassCard>

        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Tasks</p>
              <p className="text-3xl font-bold">{analytics.activeTasks?.length || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Currently in progress
          </p>
        </GlassCard>

        <GlassCard variant="elevated" className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Progress</p>
              <p className="text-3xl font-bold">{analytics.performance?.averageProgress || 0}%</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Across all active tasks
          </p>
        </GlassCard>
      </div>

      {/* Active Tasks */}
      {analytics.activeTasks && analytics.activeTasks.length > 0 && (
        <GlassCard variant="elevated">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold">My Active Tasks</h3>
          </div>
          <div className="divide-y divide-border">
            {analytics.activeTasks.map((task: any) => {
              const dueDate = formatDate(task.dueDate);

              return (
                <div key={task.taskId} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium mb-2">{task.taskTitle}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <TaskStatusBadge status={task.taskStatus} size="sm" />
                        <TaskPriorityBadge priority={task.taskPriority} size="sm" showIcon={false} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {task.projectName}
                      </p>
                    </div>
                    {task.dueDate && (
                      <div className="text-right flex-shrink-0">
                        <div className={`flex items-center gap-1 text-xs ${typeof dueDate === 'object' && dueDate.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                          <Calendar className="h-3 w-3" />
                          <span>{typeof dueDate === 'object' ? dueDate.formatted : dueDate}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground mb-1">Your Weight</p>
                      <p className="font-semibold">{task.allocatedWeight}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Reported</p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">
                        {task.reportedProgress}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Approved</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        {task.approvedProgress}%
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Your Progress</span>
                      <span className="font-medium">{task.approvedProgress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${task.approvedProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Recent Contributions */}
      {analytics.recentContributions && analytics.recentContributions.length > 0 && (
        <GlassCard variant="elevated">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold">Recent Contributions</h3>
          </div>
          <div className="divide-y divide-border">
            {analytics.recentContributions.slice(0, 5).map((contribution: any) => {
              const date = new Date(contribution.submittedAt);
              const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              });

              return (
                <div key={contribution.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium mb-1">{contribution.taskTitle}</p>
                      <p className="text-sm text-muted-foreground">{contribution.projectName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-primary">{contribution.progressPercent}%</p>
                      <p className="text-xs text-muted-foreground">{contribution.hoursSpent}h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formattedDate}</span>
                    {contribution.approvedAt && (
                      <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
                        Approved
                      </span>
                    )}
                    {!contribution.approvedAt && contribution.rejectedAt && (
                      <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 font-medium">
                        Rejected
                      </span>
                    )}
                    {!contribution.approvedAt && !contribution.rejectedAt && (
                      <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-medium">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
