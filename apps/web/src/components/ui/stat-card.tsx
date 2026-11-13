import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from './glass-card';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  loading?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  loading,
  className,
}: StatCardProps) {
  return (
    <GlassCard hover className={cn('group', className)}>
      <div className="p-6">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1">
          {loading ? (
            <div className="h-10 w-24 animate-pulse rounded-md bg-muted/20" />
          ) : (
            <div className="text-3xl font-semibold tracking-tight stat-number tabular-nums">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
          )}

          {/* Optional trend indicator */}
          {trend && !loading && (
            <div className="flex items-center gap-1 text-xs">
              <span
                className={cn(
                  'font-medium',
                  trend.direction === 'up' ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
