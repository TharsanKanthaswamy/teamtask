'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Plus, Calendar, Trash2, CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProjectMilestonesProps {
  teamId: string;
  projectId: string;
  milestones: any[];
  onUpdate: () => void;
}

export function ProjectMilestones({ teamId, projectId, milestones, onUpdate }: ProjectMilestonesProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    dueDate: '',
    weight: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.milestones.create(teamId, projectId, data),
    onSuccess: () => {
      onUpdate();
      setIsCreating(false);
      setFormData({ title: '', description: '', startDate: '', dueDate: '', weight: '' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ milestoneId, status }: { milestoneId: string; status: string }) =>
      api.milestones.update(teamId, projectId, milestoneId, { status }),
    onSuccess: () => onUpdate(),
  });

  const deleteMutation = useMutation({
    mutationFn: (milestoneId: string) =>
      api.milestones.delete(teamId, projectId, milestoneId),
    onSuccess: () => onUpdate(),
  });

  const handleCreate = () => {
    if (!formData.title.trim()) return;

    const data: any = {
      title: formData.title,
    };

    if (formData.description) data.description = formData.description;
    if (formData.startDate) data.startDate = new Date(formData.startDate).toISOString();
    if (formData.dueDate) data.dueDate = new Date(formData.dueDate).toISOString();
    if (formData.weight) data.weight = parseInt(formData.weight);

    createMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'IN_PROGRESS':
        return <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />;
      case 'BLOCKED':
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'BLOCKED':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const statuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'];

  return (
    <div className="space-y-6">
      {/* Create Milestone */}
      <GlassCard variant="elevated" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Create Milestone</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreating(!isCreating)}
            className="button-press gap-2"
          >
            <Plus className="h-4 w-4" />
            {isCreating ? 'Cancel' : 'Add Milestone'}
          </Button>
        </div>

        {isCreating && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Milestone name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What needs to be accomplished?"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={!formData.title.trim() || createMutation.isPending}
              className="button-press w-full"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Milestone'}
            </Button>
          </div>
        )}
      </GlassCard>

      {/* Milestones List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Milestones ({milestones.length})</h3>
        {milestones.length === 0 ? (
          <GlassCard variant="elevated" className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-medium mb-1">No milestones yet</h4>
                <p className="text-sm text-muted-foreground">
                  Add milestones to track project progress
                </p>
              </div>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {milestones.map((milestone: any) => (
              <GlassCard key={milestone.id} variant="elevated" className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(milestone.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{milestone.title}</h4>
                        <select
                          value={milestone.status}
                          onChange={(e) =>
                            updateStatusMutation.mutate({
                              milestoneId: milestone.id,
                              status: e.target.value,
                            })
                          }
                          className={`px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(
                            milestone.status
                          )}`}
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {milestone.description}
                        </p>
                      )}
                      {(milestone.startDate || milestone.dueDate) && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {milestone.startDate && (
                            <span>
                              Start: {new Date(milestone.startDate).toLocaleDateString()}
                            </span>
                          )}
                          {milestone.dueDate && (
                            <span>
                              Due: {new Date(milestone.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(milestone.id)}
                    disabled={deleteMutation.isPending}
                    className="button-press text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
