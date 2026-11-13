'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, TrendingUp, Clock, FileText, Link as LinkIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SubmitContributionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
  projectId: string;
  taskId: string;
  taskTitle: string;
  currentProgress?: number;
}

export function SubmitContributionDialog({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  projectId,
  taskId,
  taskTitle,
  currentProgress = 0,
}: SubmitContributionDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    progressPercent: currentProgress,
    hoursSpent: '',
    description: '',
    evidenceUrl: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.contributions.submit(teamId, projectId, taskId, data),
    onSuccess: () => {
      onSuccess();
      resetForm();
    },
    onError: (error: any) => {
      setErrors({ submit: error.message || 'Failed to submit contribution' });
    },
  });

  const resetForm = () => {
    setFormData({
      progressPercent: currentProgress,
      hoursSpent: '',
      description: '',
      evidenceUrl: '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.progressPercent < currentProgress) {
      newErrors.progressPercent = `Progress cannot decrease below current ${currentProgress}%`;
    }
    if (formData.progressPercent < 0 || formData.progressPercent > 100) {
      newErrors.progressPercent = 'Progress must be between 0 and 100';
    }
    if (!formData.hoursSpent || Number(formData.hoursSpent) <= 0) {
      newErrors.hoursSpent = 'Hours spent must be greater than 0';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.evidenceUrl && !isValidUrl(formData.evidenceUrl)) {
      newErrors.evidenceUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const submitData: any = {
      progressPercent: Number(formData.progressPercent),
      hoursSpent: Number(formData.hoursSpent),
      description: formData.description,
    };

    if (formData.evidenceUrl) {
      submitData.evidenceUrl = formData.evidenceUrl;
    }

    submitMutation.mutate(submitData);
  };

  const handleClose = () => {
    if (!submitMutation.isPending) {
      resetForm();
      onClose();
    }
  };

  const progressDelta = formData.progressPercent - currentProgress;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card text-card-foreground border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border p-6 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-semibold mb-1">Submit Progress</h2>
            <p className="text-sm text-muted-foreground truncate">{taskTitle}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={submitMutation.isPending}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Progress Info */}
          <GlassCard className="p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Current Progress</span>
              <span className="text-lg font-semibold">{currentProgress}%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
          </GlassCard>

          {/* Progress Percentage */}
          <div className="space-y-2">
            <Label htmlFor="progress">
              New Progress <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <input
                  id="progress"
                  type="range"
                  min={currentProgress}
                  max="100"
                  value={formData.progressPercent}
                  onChange={(e) =>
                    setFormData({ ...formData, progressPercent: Number(e.target.value) })
                  }
                  disabled={submitMutation.isPending}
                  className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex items-center gap-2 min-w-[100px]">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{formData.progressPercent}%</span>
                </div>
              </div>

              {progressDelta > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    +{progressDelta}% increase
                  </span>
                </div>
              )}

              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${formData.progressPercent}%` }}
                />
              </div>
            </div>
            {errors.progressPercent && (
              <p className="text-sm text-red-500">{errors.progressPercent}</p>
            )}
          </div>

          {/* Hours Spent */}
          <div className="space-y-2">
            <Label htmlFor="hours">
              Hours Spent <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="hours"
                type="number"
                min="0"
                step="0.5"
                value={formData.hoursSpent}
                onChange={(e) => setFormData({ ...formData, hoursSpent: e.target.value })}
                placeholder="e.g., 3.5"
                disabled={submitMutation.isPending}
                className="pl-9"
              />
            </div>
            {errors.hoursSpent && <p className="text-sm text-red-500">{errors.hoursSpent}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              What did you work on? <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you accomplished, challenges faced, next steps..."
              rows={5}
              disabled={submitMutation.isPending}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about your work for better progress tracking
            </p>
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>

          {/* Evidence URL */}
          <div className="space-y-2">
            <Label htmlFor="evidence">Evidence URL (Optional)</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="evidence"
                type="url"
                value={formData.evidenceUrl}
                onChange={(e) => setFormData({ ...formData, evidenceUrl: e.target.value })}
                placeholder="https://github.com/org/repo/pull/123"
                disabled={submitMutation.isPending}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Link to PR, commit, screenshot, or any supporting evidence
            </p>
            {errors.evidenceUrl && <p className="text-sm text-red-500">{errors.evidenceUrl}</p>}
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Info Box */}
          <GlassCard className="p-4 bg-blue-500/5 border-blue-500/20">
            <div className="flex gap-3">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Progress Review Process</p>
                <p>
                  Your reported progress will be reviewed by the Project Lead. Once approved, it
                  will update the task's official progress and contribute to the project completion
                  percentage.
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={submitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="button-press gap-2"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Submit Progress
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
