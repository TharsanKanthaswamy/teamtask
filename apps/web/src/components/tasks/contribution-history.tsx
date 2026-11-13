'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock, TrendingUp, Link as LinkIcon, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';

interface ContributionHistoryProps {
  teamId: string;
  projectId: string;
  taskId: string;
}

export function ContributionHistory({ teamId, projectId, taskId }: ContributionHistoryProps) {
  const { data: contributionsData, isLoading } = useQuery<any>({
    queryKey: ['contributions', teamId, projectId, taskId],
    queryFn: () => api.contributions.list(teamId, projectId, taskId),
  });

  const contributions = contributionsData?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading contributions...</div>
      </div>
    );
  }

  if (contributions.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground">No contributions yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Team members can submit their progress updates here
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {contributions.map((contribution: any) => (
        <GlassCard key={contribution.id} className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium flex-shrink-0">
                {contribution.contributor?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{contribution.contributor?.name || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(contribution.submittedAt)}
                </p>
              </div>
            </div>

            {/* Progress Badge */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-lg font-bold">{contribution.progressPercent}%</span>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-4 mb-3 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{contribution.hoursSpent} hours</span>
            </div>
            {contribution.approvedAt && (
              <div className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
                Approved
              </div>
            )}
            {!contribution.approvedAt && contribution.rejectedAt && (
              <div className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
                Rejected
              </div>
            )}
            {!contribution.approvedAt && !contribution.rejectedAt && (
              <div className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
                Pending Review
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <FileText className="h-3 w-3" />
              Work Description
            </div>
            <p className="text-sm leading-relaxed">{contribution.description}</p>
          </div>

          {/* Evidence Link */}
          {contribution.evidenceUrl && (
            <div className="mt-3 pt-3 border-t border-border">
              <a
                href={contribution.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <LinkIcon className="h-4 w-4" />
                View Evidence
              </a>
            </div>
          )}

          {/* Review Feedback */}
          {(contribution.approvedBy || contribution.rejectedBy) && contribution.reviewFeedback && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {contribution.approvedAt ? 'Approval' : 'Rejection'} Feedback
              </p>
              <p className="text-sm text-muted-foreground italic">{contribution.reviewFeedback}</p>
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  );
}
