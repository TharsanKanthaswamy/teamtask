'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Edit, Trash2, Clock, Calendar, Users, Target, TrendingUp, MessageSquare, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { TaskStatusBadge } from './task-status-badge';
import { TaskPriorityBadge } from './task-priority-badge';
import { SubmitContributionDialog } from './submit-contribution-dialog';
import { ContributionHistory } from './contribution-history';

interface TaskDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  projectId: string;
  taskId: string;
}

export function TaskDetailDialog({
  isOpen,
  onClose,
  teamId,
  projectId,
  taskId,
}: TaskDetailDialogProps) {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<'details' | 'contributions' | 'activity'>('details');
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);

  const { data: taskData, isLoading } = useQuery<any>({
    queryKey: ['task', teamId, projectId, taskId],
    queryFn: () => api.tasks.get(teamId, projectId, taskId),
    enabled: isOpen && !!taskId,
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => api.tasks.delete(teamId, projectId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', teamId, projectId] });
      onClose();
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      deleteTaskMutation.mutate();
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return { formatted: 'Not set', isOverdue: false };
    const date = new Date(dateString);
    const now = new Date();
    const isOverdue = date < now;
    const formatted = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return { formatted, isOverdue };
  };

  if (!isOpen) return null;

  const task = taskData?.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl bg-card text-card-foreground border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border p-6 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
              ) : (
                <>
                  <h2 className="text-2xl font-semibold mb-3">{task?.title}</h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <TaskStatusBadge status={task?.status || 'TODO'} size="md" />
                    <TaskPriorityBadge priority={task?.priority || 'MEDIUM'} size="md" />
                    <span className="text-sm text-muted-foreground">
                      Weight: {task?.weight || 10}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={deleteTaskMutation.isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <button
                onClick={onClose}
                disabled={deleteTaskMutation.isPending}
                className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveSection('details')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeSection === 'details'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Details
              {activeSection === 'details' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveSection('contributions')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeSection === 'contributions'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Contributions
              {activeSection === 'contributions' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-4 bg-muted animate-pulse rounded w-full" />
              <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
              <div className="h-4 bg-muted animate-pulse rounded w-4/6" />
            </div>
          ) : (
            <>
              {activeSection === 'details' && (
                <div className="space-y-6">
              {/* Description */}
              {task?.description && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Description
                  </div>
                  <p className="text-foreground leading-relaxed">{task.description}</p>
                </div>
              )}

              {/* Key Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Due Date */}
                <GlassCard className="p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Due Date</p>
                      {task?.dueDate ? (
                        (() => {
                          const { formatted, isOverdue } = formatDate(task.dueDate);
                          return (
                            <p className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                              {formatted}
                              {isOverdue && <span className="ml-2 text-xs">(Overdue)</span>}
                            </p>
                          );
                        })()
                      ) : (
                        <p className="text-muted-foreground">Not set</p>
                      )}
                    </div>
                  </div>
                </GlassCard>

                {/* Estimated Hours */}
                <GlassCard className="p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Estimated Hours</p>
                      <p className="font-medium">
                        {task?.estimatedHours ? `${task.estimatedHours} hours` : 'Not estimated'}
                      </p>
                    </div>
                  </div>
                </GlassCard>

                {/* Milestone */}
                {task?.milestone && (
                  <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Milestone</p>
                        <p className="font-medium">{task.milestone.name}</p>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* Progress */}
                <GlassCard className="p-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Progress</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Approved</span>
                          <span className="font-medium">{task?.approvedProgress || 0}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${task?.approvedProgress || 0}%` }}
                          />
                        </div>
                        {task?.reportedProgress !== task?.approvedProgress && (
                          <div className="text-xs text-muted-foreground">
                            Reported: {task?.reportedProgress || 0}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Assignees */}
              {task?.assignees && task.assignees.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Assignees ({task.assignees.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {task.assignees.map((assignee: any) => (
                      <GlassCard key={assignee.id} className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium flex-shrink-0">
                              {assignee.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{assignee.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Weight: {assignee.allocatedWeight}%
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-medium">{assignee.approvedProgress}%</p>
                            <p className="text-xs text-muted-foreground">Progress</p>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-4 border-t border-border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    <span className="font-medium">
                      {task?.createdAt ? new Date(task.createdAt).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated:</span>{' '}
                    <span className="font-medium">
                      {task?.updatedAt ? new Date(task.updatedAt).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
                </div>
              )}

              {activeSection === 'contributions' && (
                <ContributionHistory teamId={teamId} projectId={projectId} taskId={taskId} />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 flex justify-between gap-3 flex-shrink-0">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsContributionDialogOpen(true)}
              className="button-press gap-2 bg-primary"
            >
              <TrendingUp className="h-4 w-4" />
              Submit Progress
            </Button>
            <Button variant="outline" className="button-press gap-2">
              <Edit className="h-4 w-4" />
              Edit Task
            </Button>
          </div>
        </div>
      </div>

      {/* Submit Contribution Dialog */}
      {task && (
        <SubmitContributionDialog
          isOpen={isContributionDialogOpen}
          onClose={() => setIsContributionDialogOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['task', teamId, projectId, taskId] });
            queryClient.invalidateQueries({ queryKey: ['tasks', teamId, projectId] });
            setIsContributionDialogOpen(false);
          }}
          teamId={teamId}
          projectId={projectId}
          taskId={taskId}
          taskTitle={task.title}
          currentProgress={task.reportedProgress || 0}
        />
      )}
    </div>
  );
}
