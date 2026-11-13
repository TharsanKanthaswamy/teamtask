'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Save, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProjectSettingsProps {
  project: any;
  teamId: string;
  onUpdate: () => void;
}

export function ProjectSettings({ project, teamId, onUpdate }: ProjectSettingsProps) {
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || '',
    objectives: project.objectives || '',
    priority: project.priority,
    startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
    targetEndDate: project.targetEndDate ? new Date(project.targetEndDate).toISOString().split('T')[0] : '',
  });

  const [statusData, setStatusData] = useState({
    status: project.status,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.projects.update(teamId, project.id, data),
    onSuccess: () => {
      onUpdate();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => api.projects.updateStatus(teamId, project.id, status),
    onSuccess: () => {
      onUpdate();
    },
  });

  const handleSaveDetails = () => {
    const updates: any = {
      name: formData.name,
      priority: formData.priority,
    };

    if (formData.description) updates.description = formData.description;
    if (formData.objectives) updates.objectives = formData.objectives;
    if (formData.startDate) updates.startDate = new Date(formData.startDate).toISOString();
    if (formData.targetEndDate) updates.targetEndDate = new Date(formData.targetEndDate).toISOString();

    updateMutation.mutate(updates);
  };

  const handleStatusChange = () => {
    if (statusData.status !== project.status) {
      updateStatusMutation.mutate(statusData.status);
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Details */}
      <GlassCard variant="elevated" className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Project Details</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objectives">Objectives</Label>
              <textarea
                id="objectives"
                value={formData.objectives}
                onChange={(e) => setFormData((prev) => ({ ...prev, objectives: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
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
                <Label htmlFor="targetEndDate">Target End Date</Label>
                <Input
                  id="targetEndDate"
                  type="date"
                  value={formData.targetEndDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetEndDate: e.target.value }))}
                />
              </div>
            </div>

            <Button
              onClick={handleSaveDetails}
              disabled={updateMutation.isPending}
              className="button-press gap-2 w-full"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Project Status */}
      <GlassCard variant="elevated" className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">Project Status</h3>
            <p className="text-sm text-muted-foreground">
              Change the current status of the project
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={statusData.status}
                onChange={(e) => setStatusData({ status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <Button
              onClick={handleStatusChange}
              disabled={statusData.status === project.status || updateStatusMutation.isPending}
              className="button-press gap-2 w-full"
            >
              {updateStatusMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Status
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Project Information */}
      <GlassCard variant="elevated" className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Project Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Project ID</span>
              <span className="font-mono text-xs">{project.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-medium">{project.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>
                {new Date(project.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>
                {new Date(project.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
