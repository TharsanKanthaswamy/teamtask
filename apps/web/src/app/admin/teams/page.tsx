'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  Users,
  Folder,
  Shield,
  X,
  Loader2,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AdminTeamsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
  const [formError, setFormError] = useState('');

  const { data: teamsData, isLoading } = useQuery<any>({
    queryKey: ['admin-teams'],
    queryFn: () => api.teams.list(),
  });

  const teams = teamsData?.data || [];

  const createTeamMutation = useMutation({
    mutationFn: (data: { name: string; slug: string; description?: string }) =>
      api.teams.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      setIsCreateOpen(false);
      setFormData({ name: '', slug: '', description: '' });
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create team');
    },
  });

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Team name is required');
      return;
    }
    if (!formData.slug.trim()) {
      setFormError('Team slug is required');
      return;
    }
    setFormError('');
    createTeamMutation.mutate({
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim() || undefined,
    });
  };

  const filteredTeams = teams.filter((t: any) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalTeams: teams.length,
    activeTeams: teams.filter((t: any) => t.status === 'ACTIVE').length,
    totalLeads: teams.reduce((acc: number, t: any) => acc + (t.leadCount || 0), 0),
    totalMembers: teams.reduce((acc: number, t: any) => acc + (t.memberCount || 0), 0),
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
                Teams Management
              </h1>
              <p className="body-text text-base text-muted-foreground max-w-2xl mt-1">
                Create, organize, and monitor departments and functional teams across your organization
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="button-press gap-2 shadow-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Create Team
              </Button>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Teams"
            value={stats.totalTeams}
            icon={Building2}
            loading={isLoading}
          />
          <StatCard
            title="Active Teams"
            value={stats.activeTeams}
            icon={CheckCircle2}
            loading={isLoading}
          />
          <StatCard
            title="Team Leads"
            value={stats.totalLeads}
            icon={Shield}
            loading={isLoading}
          />
          <StatCard
            title="Total Members"
            value={stats.totalMembers}
            icon={Users}
            loading={isLoading}
          />
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams by name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background text-foreground"
            />
          </div>
        </div>

        {/* Teams Grid */}
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <GlassCard key={i} variant="elevated" className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </GlassCard>
            ))}
          </div>
        ) : filteredTeams.length === 0 ? (
          <GlassCard variant="elevated" className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">
                  {searchQuery ? 'No teams match your search' : 'No teams found'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {searchQuery
                    ? 'Try searching with a different keyword or slug.'
                    : 'Get started by creating your first team.'}
                </p>
              </div>
              {!searchQuery && (
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Team
                </Button>
              )}
            </div>
          </GlassCard>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team: any) => (
              <GlassCard
                key={team.id}
                variant="elevated"
                className="p-6 flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                        {team.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground leading-snug">
                          {team.name}
                        </h3>
                        <span className="text-xs text-muted-foreground font-mono">
                          /{team.slug}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        team.status === 'ACTIVE'
                          ? 'bg-success/15 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {team.status}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {team.description || 'No description provided.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      <span>{team.leadCount || 1} Team Lead</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span>{team.memberCount || 0} Members</span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-border/40 flex items-center justify-between">
                  <Link
                    href={`/admin/teams/${team.id}/projects`}
                    className="button-press inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <Folder className="h-3.5 w-3.5" />
                    <span>View Projects</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  <span className="text-xs text-muted-foreground">
                    Created {new Date(team.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Create Team Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-card text-card-foreground border border-border shadow-2xl">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Create New Team</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName" className="text-foreground font-medium">Team Name *</Label>
                  <Input
                    id="teamName"
                    placeholder="e.g. Design Systems, Cloud Ops"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="bg-background text-foreground"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamSlug" className="text-foreground font-medium">Slug *</Label>
                  <Input
                    id="teamSlug"
                    placeholder="e.g. design-systems"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    className="bg-background text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamDescription" className="text-foreground font-medium">Description</Label>
                  <textarea
                    id="teamDescription"
                    rows={3}
                    placeholder="What is this team responsible for?"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {formError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-border/50">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={createTeamMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTeamMutation.isPending}
                    className="gap-2 font-medium"
                  >
                    {createTeamMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Create Team
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

