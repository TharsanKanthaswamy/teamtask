'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, MessageCircle, Clock, TrendingUp, Link as LinkIcon, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ReviewQueueProps {
  teamId: string;
  projectId: string;
}

export function ReviewQueue({ teamId, projectId }: ReviewQueueProps) {
  const queryClient = useQueryClient();
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<{
    reviewId: string;
    action: 'approve' | 'reject' | 'request-changes';
    feedback: string;
  } | null>(null);

  const { data: reviewsData, isLoading } = useQuery<any>({
    queryKey: ['pending-reviews', teamId, projectId],
    queryFn: () => api.reviews.getPending(teamId, projectId),
  });

  const approveMutation = useMutation({
    mutationFn: ({ reviewId, feedback }: { reviewId: string; feedback?: string }) =>
      api.reviews.approve(teamId, projectId, reviewId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-reviews', teamId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', teamId, projectId] });
      setReviewAction(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ reviewId, feedback }: { reviewId: string; feedback: string }) =>
      api.reviews.reject(teamId, projectId, reviewId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-reviews', teamId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', teamId, projectId] });
      setReviewAction(null);
    },
  });

  const requestChangesMutation = useMutation({
    mutationFn: ({ reviewId, feedback }: { reviewId: string; feedback: string }) =>
      api.reviews.requestChanges(teamId, projectId, reviewId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-reviews', teamId, projectId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', teamId, projectId] });
      setReviewAction(null);
    },
  });

  const handleApprove = (reviewId: string) => {
    setReviewAction({ reviewId, action: 'approve', feedback: '' });
  };

  const handleReject = (reviewId: string) => {
    setReviewAction({ reviewId, action: 'reject', feedback: '' });
  };

  const handleRequestChanges = (reviewId: string) => {
    setReviewAction({ reviewId, action: 'request-changes', feedback: '' });
  };

  const handleSubmitReview = () => {
    if (!reviewAction) return;

    const { reviewId, action, feedback } = reviewAction;

    if (action === 'approve') {
      approveMutation.mutate({ reviewId, feedback: feedback || undefined });
    } else if (action === 'reject') {
      if (!feedback.trim()) return;
      rejectMutation.mutate({ reviewId, feedback });
    } else if (action === 'request-changes') {
      if (!feedback.trim()) return;
      requestChangesMutation.mutate({ reviewId, feedback });
    }
  };

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

  const reviews = reviewsData?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading reviews...</div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
        <p className="text-muted-foreground">
          No pending contributions to review at the moment
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pending Reviews</h3>
          <p className="text-sm text-muted-foreground">
            {reviews.length} {reviews.length === 1 ? 'contribution' : 'contributions'} awaiting your review
          </p>
        </div>
      </div>

      {/* Review Items */}
      <div className="space-y-3">
        {reviews.map((review: any) => {
          const isExpanded = expandedReview === review.id;
          const isReviewing = reviewAction?.reviewId === review.id;

          return (
            <GlassCard key={review.id} variant="elevated" className="overflow-hidden">
              {/* Review Header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {review.contributor?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{review.taskTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        by {review.contributor?.name} • {formatDate(review.submittedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Badge */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-xl font-bold">{review.progressPercent}%</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{review.hoursSpent} hours</span>
                  </div>
                  <div className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
                    Pending Review
                  </div>
                </div>

                {/* Quick Preview */}
                <p className="text-sm line-clamp-2 mb-3">{review.description}</p>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setExpandedReview(isExpanded ? null : review.id)}
                    variant="outline"
                    size="sm"
                    className="button-press gap-2"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        View Details
                      </>
                    )}
                  </Button>

                  {!isReviewing && (
                    <>
                      <Button
                        onClick={() => handleApprove(review.id)}
                        size="sm"
                        className="button-press gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRequestChanges(review.id)}
                        size="sm"
                        variant="outline"
                        className="button-press gap-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Request Changes
                      </Button>
                      <Button
                        onClick={() => handleReject(review.id)}
                        size="sm"
                        variant="outline"
                        className="button-press gap-2 text-red-600 hover:text-red-700 border-red-200 dark:border-red-800"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-border p-4 bg-muted/30 space-y-4">
                  {/* Full Description */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      Work Description
                    </div>
                    <p className="text-sm leading-relaxed">{review.description}</p>
                  </div>

                  {/* Evidence Link */}
                  {review.evidenceUrl && (
                    <div>
                      <a
                        href={review.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <LinkIcon className="h-4 w-4" />
                        View Evidence
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Review Action Form */}
              {isReviewing && reviewAction && (
                <div className="border-t border-border p-4 bg-muted/50 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`feedback-${review.id}`}>
                      {reviewAction.action === 'approve'
                        ? 'Feedback (Optional)'
                        : 'Feedback (Required)'}
                    </Label>
                    <textarea
                      id={`feedback-${review.id}`}
                      value={reviewAction.feedback}
                      onChange={(e) =>
                        setReviewAction({ ...reviewAction, feedback: e.target.value })
                      }
                      placeholder={
                        reviewAction.action === 'approve'
                          ? 'Great work! (optional)'
                          : reviewAction.action === 'reject'
                          ? 'Explain why this contribution is being rejected...'
                          : 'Specify what changes are needed...'
                      }
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => setReviewAction(null)}
                      variant="ghost"
                      size="sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitReview}
                      size="sm"
                      disabled={
                        (reviewAction.action !== 'approve' && !reviewAction.feedback.trim()) ||
                        approveMutation.isPending ||
                        rejectMutation.isPending ||
                        requestChangesMutation.isPending
                      }
                      className="button-press"
                    >
                      {approveMutation.isPending ||
                      rejectMutation.isPending ||
                      requestChangesMutation.isPending
                        ? 'Submitting...'
                        : reviewAction.action === 'approve'
                        ? 'Confirm Approval'
                        : reviewAction.action === 'reject'
                        ? 'Confirm Rejection'
                        : 'Send Feedback'}
                    </Button>
                  </div>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
