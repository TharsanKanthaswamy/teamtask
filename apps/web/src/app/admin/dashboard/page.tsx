'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2,
  Users,
  Activity,
  CheckCircle2,
  Plus,
  Folder,
  ArrowRight,
  TrendingUp,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/ui/stat-card';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<any>({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.platformAdmin.getDashboard(),
  });

  const { data: globalAnalyticsData } = useQuery<any>({
    queryKey: ['analytics-global'],
    queryFn: () => api.analytics.global(),
  });

  const { data: activityData } = useQuery<any>({
    queryKey: ['admin-activity-preview'],
    queryFn: () => api.platformAdmin.getActivity(6),
  });

  const stats = dashboardData?.data || {
    totalTeams: 0,
    totalUsers: 0,
    activeTeams: 0,
    recentActivity: 0,
  };

  const analytics = globalAnalyticsData?.data;
  const recentActivities = activityData?.data || [];

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 gradient-mesh opacity-40" />

      <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl">
        {/* Header with Quick Actions */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="display-text text-2xl sm:text-4xl font-semibold tracking-tight text-foreground">
              Platform Overview
            </h1>
            <p className="body-text text-base text-muted-foreground mt-1 max-w-2xl">
              Monitor teams, organization members, and real-time operations across TeamTrack
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href="/admin/teams">
              <Button size="sm" className="gap-1.5 shadow-sm font-medium">
                <Plus className="h-4 w-4" />
                New Team
              </Button>
            </Link>
            <Link href="/admin/projects">
              <Button size="sm" variant="outline" className="gap-1.5 font-medium">
                <Folder className="h-4 w-4 text-primary" />
                Projects
              </Button>
            </Link>
            <Link href="/admin/members">
              <Button size="sm" variant="outline" className="gap-1.5 font-medium">
                <Users className="h-4 w-4 text-primary" />
                Members
              </Button>
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Teams"
            value={stats.totalTeams}
            icon={Building2}
            loading={dashboardLoading}
          />
          <StatCard
            title="Total Members"
            value={stats.totalUsers}
            icon={Users}
            loading={dashboardLoading}
          />
          <StatCard
            title="Active Teams"
            value={stats.activeTeams}
            icon={CheckCircle2}
            loading={dashboardLoading}
          />
          <StatCard
            title="Events (24h)"
            value={stats.recentActivity}
            icon={Activity}
            loading={dashboardLoading}
          />
        </div>

        {/* Analytics Highlights if available */}
        {analytics && (
          <div className="grid gap-5 md:grid-cols-3">
            <GlassCard variant="elevated" className="p-6 space-y-2 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Active Projects
                </span>
                <Folder className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {analytics.summary?.activeProjects || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {stats.totalTeams} operational teams
              </p>
            </GlassCard>

            <GlassCard variant="elevated" className="p-6 space-y-2 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Completed Tasks
                </span>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {analytics.summary?.completedTasks || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Out of {analytics.summary?.totalTasks || 0} total tasks tracked
              </p>
            </GlassCard>

            <GlassCard variant="elevated" className="p-6 space-y-2 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  On-Time Completion Rate
                </span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {analytics.performance?.totalCompleted > 0
                  ? `${Math.round(
                      (analytics.performance.onTimeCompletions /
                        analytics.performance.totalCompleted) *
                        100
                    )}%`
                  : '100%'}
              </div>
              <p className="text-xs text-muted-foreground">
                Deadline compliance benchmark
              </p>
            </GlassCard>
          </div>
        )}

        {/* Quick Navigation Cards & Activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity Feed */}
          <GlassCard variant="elevated" className="lg:col-span-2 p-6 space-y-4 border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Recent Platform Activity
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Latest actions recorded by the audit logger
                </p>
              </div>
              <Link
                href="/admin/activity"
                className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                <span>View all logs</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Activity className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <h3 className="text-sm font-medium text-foreground">No recent activity</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Activity events will stream here as teams create projects and tasks.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentActivities.map((act: any) => (
                  <div key={act.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0">
                        {act.actor?.name?.slice(0, 2).toUpperCase() || 'SY'}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">
                          {act.actor?.name || 'System'}{' '}
                          <span className="font-normal text-muted-foreground">
                            performed {act.action} on {act.entityType}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {act.team?.name ? `Team: ${act.team.name}` : act.actor?.email}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(act.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Quick Platform Shortcuts */}
          <GlassCard variant="elevated" className="p-6 space-y-4 border border-border shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Admin Shortcuts</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Frequently accessed platform controls
                </p>
              </div>

              <div className="space-y-2">
                <Link
                  href="/admin/teams"
                  className="flex items-center justify-between p-3 rounded-xl border border-border/70 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Manage Teams</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>

                <Link
                  href="/admin/members"
                  className="flex items-center justify-between p-3 rounded-xl border border-border/70 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Organization Members</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>

                <Link
                  href="/admin/settings"
                  className="flex items-center justify-between p-3 rounded-xl border border-border/70 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Security & System Policies</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>

                <Link
                  href="/workspace/projects"
                  className="flex items-center justify-between p-3 rounded-xl border border-border/70 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Layers className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Workspace View</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary">
              <span className="font-semibold">Super Admin Session Active:</span> Full system access enabled across all tenants.
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
