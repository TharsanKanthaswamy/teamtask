'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Search,
  RefreshCw,
  Shield,
  Clock,
  Building2,
  User,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AdminActivityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { data: activityData, isLoading, refetch, isFetching } = useQuery<any>({
    queryKey: ['admin-activity'],
    queryFn: () => api.platformAdmin.getActivity(100),
  });

  const activities = activityData?.data || [];

  const filteredActivities = activities.filter((act: any) => {
    const matchesSearch =
      act.actor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.actor?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.entityType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.team?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction =
      selectedAction === 'ALL' || act.action === selectedAction;

    return matchesSearch && matchesAction;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD'))
      return 'bg-success/15 text-success border-success/30';
    if (action.includes('UPDATE') || action.includes('ASSIGN') || action.includes('APPROVE'))
      return 'bg-primary/15 text-primary border-primary/30';
    if (action.includes('DELETE') || action.includes('REMOVE') || action.includes('REJECT'))
      return 'bg-destructive/15 text-destructive border-destructive/30';
    return 'bg-muted text-muted-foreground border-border';
  };

  const stats = {
    total: activities.length,
    usersActive: new Set(activities.map((a: any) => a.actorId)).size,
    teamsActive: new Set(activities.map((a: any) => a.teamId).filter(Boolean)).size,
    recentHour: activities.filter((a: any) => {
      const diff = Date.now() - new Date(a.createdAt).getTime();
      return diff < 60 * 60 * 1000;
    }).length,
  };

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 gradient-mesh opacity-40" />

      <div className="space-y-8 p-8">
        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="display-text text-4xl font-semibold tracking-tight text-foreground">
                Platform Activity & Audit Logs
              </h1>
              <p className="body-text text-base text-muted-foreground max-w-2xl mt-1">
                Real-time security auditing, event streams, and workspace action logs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
                className="gap-2 font-medium"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Events"
            value={stats.total}
            icon={Activity}
            loading={isLoading}
          />
          <StatCard
            title="Active Users"
            value={stats.usersActive}
            icon={User}
            loading={isLoading}
          />
          <StatCard
            title="Active Teams"
            value={stats.teamsActive}
            icon={Building2}
            loading={isLoading}
          />
          <StatCard
            title="Events (Past Hour)"
            value={stats.recentHour}
            icon={Clock}
            loading={isLoading}
          />
        </div>

        {/* Search & Action Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by actor, entity, action, or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background text-foreground"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
            </select>
          </div>
        </div>

        {/* Activity Feed */}
        <GlassCard variant="elevated" className="overflow-hidden border border-border shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              Loading activity logs...
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-semibold text-foreground">No activity recorded</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || selectedAction !== 'ALL'
                  ? 'No logs match your current filter query.'
                  : 'Events will be automatically streamed here as actions are performed.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredActivities.map((log: any) => {
                const isExpanded = expandedLogId === log.id;

                return (
                  <div
                    key={log.id}
                    className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0">
                          {log.actor?.name?.slice(0, 2).toUpperCase() || 'SY'}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap text-sm">
                            <span className="font-semibold text-foreground">
                              {log.actor?.name || 'System / Service'}
                            </span>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded border font-mono font-medium ${getActionBadgeColor(
                                log.action
                              )}`}
                            >
                              {log.action}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              on
                            </span>
                            <span className="text-xs font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border">
                              {log.entityType || 'RESOURCE'}
                            </span>
                            {log.team && (
                              <>
                                <span className="text-xs text-muted-foreground">
                                  in
                                </span>
                                <span className="text-xs font-medium text-primary">
                                  {log.team.name}
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{log.actor?.email}</span>
                            {log.ipAddress && (
                              <>
                                <span>•</span>
                                <span className="font-mono">{log.ipAddress}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Collapsible Metadata */}
                    {isExpanded && log.metadata && (
                      <div className="mt-3 ml-11 p-3 rounded-lg bg-black/40 border border-border/70 text-xs font-mono text-zinc-300 overflow-x-auto animate-fade-in">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                          Log Payload / Metadata
                        </div>
                        <pre className="text-xs">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

