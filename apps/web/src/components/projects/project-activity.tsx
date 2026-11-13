'use client';

import { Activity as ActivityIcon, User } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';

interface ProjectActivityProps {
  activity: any[];
}

export function ProjectActivity({ activity }: ProjectActivityProps) {
  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-green-600 dark:text-green-400';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'text-red-600 dark:text-red-400';
    if (action.includes('UPDATE') || action.includes('ASSIGN')) return 'text-blue-600 dark:text-blue-400';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Activity Timeline</h3>
        {activity.length === 0 ? (
          <GlassCard variant="elevated" className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
                <ActivityIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-medium mb-1">No activity yet</h4>
                <p className="text-sm text-muted-foreground">
                  Activity will appear here as the project progresses
                </p>
              </div>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {activity.map((log: any) => (
              <GlassCard key={log.id} variant="elevated" className="p-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-medium">{log.actor.name}</span>
                      <span className={`text-sm ${getActionColor(log.action)}`}>
                        {formatAction(log.action)}
                      </span>
                    </div>
                    {log.metadata && (
                      <div className="text-sm text-muted-foreground">
                        {log.metadata.projectName && <span>Project: {log.metadata.projectName}</span>}
                        {log.metadata.userName && <span>User: {log.metadata.userName}</span>}
                        {log.metadata.title && <span>Milestone: {log.metadata.title}</span>}
                        {log.metadata.newStatus && <span>Status: {log.metadata.newStatus}</span>}
                      </div>
                    )}
                    <time className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
