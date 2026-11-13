'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Loader2, UserCheck, Edit3 } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
  members: any[];
}

export function CreateProjectDialog({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  members,
}: CreateProjectDialogProps) {
  const hasMembers = members && members.length > 0;
  const [isManualLead, setIsManualLead] = useState(!hasMembers);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    objectives: '',
    projectLeadId: !hasMembers ? 'OTHER' : '',
    manualLeadName: '',
    priority: 'MEDIUM',
    startDate: '',
    targetEndDate: '',
    initialMemberIds: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (!members || members.length === 0) {
        setIsManualLead(true);
        setFormData((prev) => ({ ...prev, projectLeadId: 'OTHER' }));
      }
    }
  }, [isOpen, members]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.projects.create(teamId, data),
    onSuccess: () => {
      onSuccess();
      resetForm();
    },
    onError: (error: any) => {
      setErrors({ submit: error.message || 'Failed to create project' });
    },
  });

  const resetForm = () => {
    const emptyMembers = !members || members.length === 0;
    setIsManualLead(emptyMembers);
    setFormData({
      name: '',
      slug: '',
      description: '',
      objectives: '',
      projectLeadId: emptyMembers ? 'OTHER' : '',
      manualLeadName: '',
      priority: 'MEDIUM',
      startDate: '',
      targetEndDate: '',
      initialMemberIds: [],
    });
    setErrors({});
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    setFormData((prev) => ({ ...prev, name, slug }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.slug.trim()) newErrors.slug = 'Project slug is required';

    if (isManualLead || formData.projectLeadId === 'OTHER') {
      if (!formData.manualLeadName.trim()) {
        newErrors.manualLeadName = 'Please enter the team lead name or email';
      }
    } else if (!formData.projectLeadId) {
      newErrors.projectLeadId = 'Project lead is required';
    }

    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const isManual = isManualLead || formData.projectLeadId === 'OTHER';
    const submitData: any = {
      name: formData.name,
      slug: formData.slug,
      projectLeadId: isManual ? 'OTHER' : formData.projectLeadId,
      priority: formData.priority,
    };

    if (isManual) {
      submitData.manualLeadName = formData.manualLeadName.trim();
    }

    if (formData.description) submitData.description = formData.description;
    if (formData.objectives) submitData.objectives = formData.objectives;
    if (formData.startDate) submitData.startDate = new Date(formData.startDate).toISOString();
    if (formData.targetEndDate) submitData.targetEndDate = new Date(formData.targetEndDate).toISOString();
    if (formData.initialMemberIds.length > 0) submitData.initialMemberIds = formData.initialMemberIds;

    createMutation.mutate(submitData);
  };

  const toggleMember = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      initialMemberIds: prev.initialMemberIds.includes(memberId)
        ? prev.initialMemberIds.filter((id) => id !== memberId)
        : [...prev.initialMemberIds, memberId],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card text-card-foreground border border-border shadow-2xl">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Create Project</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Set up a new project for your team
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="button-press h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground font-medium">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Website Redesign"
                className={`bg-background text-foreground ${errors.name ? 'border-destructive' : ''}`}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-foreground font-medium">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="website-redesign"
                className={`bg-background text-foreground ${errors.slug ? 'border-destructive' : ''}`}
              />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground font-medium">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief overview of the project"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Objectives */}
            <div className="space-y-2">
              <Label htmlFor="objectives" className="text-foreground font-medium">Objectives</Label>
              <textarea
                id="objectives"
                value={formData.objectives}
                onChange={(e) => setFormData((prev) => ({ ...prev, objectives: e.target.value }))}
                placeholder="What are the goals and success criteria?"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Project Lead */}
            <div className="space-y-3 p-4 rounded-xl border border-border/60 bg-muted/20">
              <div className="flex items-center justify-between">
                <Label htmlFor="projectLeadId" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Project Lead *
                </Label>
                {formData.projectLeadId === 'OTHER' && hasMembers && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        projectLeadId: members[0]?.id || '',
                      }));
                    }}
                    className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    <UserCheck className="h-3 w-3" />
                    Select from members list
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <select
                  id="projectLeadId"
                  value={formData.projectLeadId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({ ...prev, projectLeadId: val }));
                    if (errors.projectLeadId) {
                      setErrors((prev) => {
                        const rest = { ...prev };
                        delete rest.projectLeadId;
                        return rest;
                      });
                    }
                  }}
                  className={`w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer ${
                    errors.projectLeadId ? 'border-destructive' : 'border-border'
                  }`}
                >
                  <option value="" className="bg-background text-foreground">
                    {hasMembers ? 'Select a team member...' : 'No team members in this team'}
                  </option>
                  {members.map((member: any) => (
                    <option key={member.id} value={member.id} className="bg-background text-foreground py-1">
                      {member.user?.name || member.name || member.user?.email || member.email} {member.role === 'TEAM_LEAD' ? '(Team Lead)' : ''}
                    </option>
                  ))}
                  <option value="OTHER" className="bg-background text-foreground font-semibold py-1">
                    ✨ Others (type team lead manually)
                  </option>
                </select>
                {errors.projectLeadId && (
                  <p className="text-xs text-destructive">{errors.projectLeadId}</p>
                )}
              </div>

              {formData.projectLeadId === 'OTHER' && (
                <div className="space-y-2 pt-1 animate-fade-in border-t border-border/50">
                  <Label htmlFor="manualLeadName" className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Edit3 className="h-3.5 w-3.5 text-primary" />
                    Team Lead Name or Email *
                  </Label>
                  <Input
                    id="manualLeadName"
                    placeholder="Enter team lead name or email (e.g. David Kim or david@company.com)..."
                    value={formData.manualLeadName}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        manualLeadName: e.target.value,
                      }));
                      if (errors.manualLeadName) {
                        setErrors((prev) => {
                          const rest = { ...prev };
                          delete rest.manualLeadName;
                          return rest;
                        });
                      }
                    }}
                    className={`bg-background text-foreground font-medium ${
                      errors.manualLeadName ? 'border-destructive' : ''
                    }`}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    This person will be designated as the Project Lead automatically.
                  </p>
                  {errors.manualLeadName && (
                    <p className="text-xs text-destructive">{errors.manualLeadName}</p>
                  )}
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-foreground font-medium">Priority</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                <option value="LOW" className="bg-background text-foreground">Low</option>
                <option value="MEDIUM" className="bg-background text-foreground">Medium</option>
                <option value="HIGH" className="bg-background text-foreground">High</option>
                <option value="CRITICAL" className="bg-background text-foreground">Critical</option>
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-foreground font-medium">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetEndDate" className="text-foreground font-medium">Target End Date</Label>
                <Input
                  id="targetEndDate"
                  type="date"
                  value={formData.targetEndDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetEndDate: e.target.value }))}
                  className="bg-background text-foreground"
                />
              </div>
            </div>

            {/* Initial Members */}
            {hasMembers && (
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Initial Team Members</Label>
                <div className="space-y-2 max-h-36 overflow-y-auto p-3 rounded-lg border border-border bg-muted/20">
                  {members.map((member: any) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.initialMemberIds.includes(member.id)}
                        onChange={() => toggleMember(member.id)}
                        className="rounded border-border accent-primary h-4 w-4"
                      />
                      <span className="text-sm text-foreground">{member.user?.name || member.name}</span>
                      {member.role === 'TEAM_LEAD' && (
                        <span className="text-xs text-muted-foreground font-medium">(Team Lead)</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {errors.submit && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border/50">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={createMutation.isPending}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="button-press gap-2 font-medium"
              >
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Create Project
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
