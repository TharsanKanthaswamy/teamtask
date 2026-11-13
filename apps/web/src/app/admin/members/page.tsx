'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  Building2,
  X,
  Loader2,
  Trash2,
  Mail,
  Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserProfileDialog } from '@/components/members/user-profile-dialog';

export default function AdminMembersPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'MEMBER'>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MEMBER' as 'SUPER_ADMIN' | 'MEMBER',
    teamId: '',
    teamRole: 'TEAM_MEMBER' as 'TEAM_LEAD' | 'TEAM_MEMBER',
  });
  const [formError, setFormError] = useState('');

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery<any>({
    queryKey: ['admin-users', searchQuery],
    queryFn: () => api.platformAdmin.getUsers(searchQuery),
  });

  // Fetch teams for the assignment dropdown
  const { data: teamsData } = useQuery<any>({
    queryKey: ['admin-teams'],
    queryFn: () => api.teams.list(),
  });

  const users = usersData?.data || [];
  const teams = teamsData?.data || [];

  const createUserMutation = useMutation({
    mutationFn: (data: any) => api.platformAdmin.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      setIsAddOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'MEMBER',
        teamId: '',
        teamRole: 'TEAM_MEMBER',
      });
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create member');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => api.platformAdmin.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteConfirmId(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to remove user');
      setDeleteConfirmId(null);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Member name is required');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Valid email address is required');
      return;
    }
    setFormError('');
    createUserMutation.mutate({
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password.trim() || undefined,
      role: formData.role,
      teamId: formData.teamId || undefined,
      teamRole: formData.teamRole,
    });
  };

  const filteredUsers = users.filter((u: any) => {
    if (roleFilter === 'ADMIN') return !!u.platformAdmin;
    if (roleFilter === 'MEMBER') return !u.platformAdmin;
    return true;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u: any) => !!u.platformAdmin).length,
    leads: users.filter((u: any) =>
      u.teamMembers?.some((tm: any) => tm.role === 'TEAM_LEAD')
    ).length,
    active: users.filter((u: any) => u.status === 'ACTIVE').length,
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
                Members Management
              </h1>
              <p className="body-text text-base text-muted-foreground max-w-2xl mt-1">
                Manage accounts, assign roles, and administer organization-wide access
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsAddOpen(true)}
                className="button-press gap-2 shadow-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Add Member
              </Button>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Members"
            value={stats.total}
            icon={Users}
            loading={usersLoading}
          />
          <StatCard
            title="Platform Admins"
            value={stats.admins}
            icon={ShieldAlert}
            loading={usersLoading}
          />
          <StatCard
            title="Team Leads"
            value={stats.leads}
            icon={Shield}
            loading={usersLoading}
          />
          <StatCard
            title="Active Accounts"
            value={stats.active}
            icon={UserCheck}
            loading={usersLoading}
          />
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background text-foreground"
            />
          </div>

          <div className="flex items-center gap-2 border border-border p-1 rounded-lg bg-card">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                roleFilter === 'ALL'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter('ADMIN')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                roleFilter === 'ADMIN'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Admins ({stats.admins})
            </button>
            <button
              onClick={() => setRoleFilter('MEMBER')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                roleFilter === 'MEMBER'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Members ({users.length - stats.admins})
            </button>
          </div>
        </div>

        {/* Members Table */}
        <GlassCard variant="elevated" className="overflow-hidden border border-border shadow-sm">
          {usersLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              Loading members...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-semibold text-foreground">No members found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Try modifying your search filter or add a new member.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Member</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Teams</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Joined</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.map((user: any) => {
                    const isAdmin = !!user.platformAdmin;
                    const teamsList = user.teamMembers || [];

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            onClick={() => setSelectedProfileUser(user)}
                            className="flex items-center gap-3 cursor-pointer group"
                            title="Click to view full profile"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              {user.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {isAdmin && (
                                  <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary font-semibold">
                              <ShieldAlert className="h-3 w-3" />
                              Platform Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                              Member
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {teamsList.length === 0 ? (
                              <span className="text-xs text-muted-foreground italic">
                                No teams assigned
                              </span>
                            ) : (
                              teamsList.map((tm: any) => (
                                <span
                                  key={tm.id}
                                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-muted/60 border border-border/60 text-foreground"
                                >
                                  <Building2 className="h-3 w-3 text-muted-foreground" />
                                  <span>{tm.team?.name || 'Team'}</span>
                                  {tm.role === 'TEAM_LEAD' && (
                                    <span className="text-[10px] text-primary font-semibold">
                                      (Lead)
                                    </span>
                                  )}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium ${
                              user.status === 'ACTIVE'
                                ? 'bg-success/15 text-success'
                                : 'bg-destructive/15 text-destructive'
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                          {deleteConfirmId === user.id ? (
                            <div className="inline-flex items-center gap-1.5">
                              <span className="text-xs text-destructive font-medium">Confirm?</span>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                disabled={deleteUserMutation.isPending}
                                className="h-7 px-2 text-xs"
                              >
                                {deleteUserMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Yes'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteConfirmId(null)}
                                className="h-7 px-2 text-xs"
                              >
                                No
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(user.id)}
                              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Add Member Dialog */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-card text-card-foreground border border-border shadow-2xl">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Add Organization Member</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAddOpen(false)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="memberName" className="text-foreground font-medium">Full Name *</Label>
                  <Input
                    id="memberName"
                    placeholder="e.g. Maya Lin"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-background text-foreground"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memberEmail" className="text-foreground font-medium">Email Address *</Label>
                  <Input
                    id="memberEmail"
                    type="email"
                    placeholder="e.g. maya@teamtrack.local"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="bg-background text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memberPassword" className="text-foreground font-medium">Initial Password</Label>
                  <Input
                    id="memberPassword"
                    type="password"
                    placeholder="Leave blank for default (Welcome@123)"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="bg-background text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="memberRole" className="text-foreground font-medium">Platform Role</Label>
                    <select
                      id="memberRole"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          role: e.target.value as 'SUPER_ADMIN' | 'MEMBER',
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    >
                      <option value="MEMBER">Standard Member</option>
                      <option value="SUPER_ADMIN">Platform Admin</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teamId" className="text-foreground font-medium">Assign Team</Label>
                    <select
                      id="teamId"
                      value={formData.teamId}
                      onChange={(e) => setFormData((prev) => ({ ...prev, teamId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    >
                      <option value="">None (Assign later)</option>
                      {teams.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.teamId && (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="teamRole" className="text-foreground font-medium">Role in Selected Team</Label>
                    <select
                      id="teamRole"
                      value={formData.teamRole}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          teamRole: e.target.value as 'TEAM_LEAD' | 'TEAM_MEMBER',
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                    >
                      <option value="TEAM_MEMBER">Team Member</option>
                      <option value="TEAM_LEAD">Team Lead</option>
                    </select>
                  </div>
                )}

                {formError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-border/50">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddOpen(false)}
                    disabled={createUserMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="gap-2 font-medium"
                  >
                    {createUserMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Add Member
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* User Profile Modal */}
      {selectedProfileUser && (
        <UserProfileDialog
          isOpen={!!selectedProfileUser}
          onClose={() => setSelectedProfileUser(null)}
          teamId={selectedProfileUser.teamMembers?.[0]?.teamId || teams[0]?.id || ''}
          memberId={selectedProfileUser.teamMembers?.[0]?.id || selectedProfileUser.id}
          fallbackName={selectedProfileUser.name}
          fallbackEmail={selectedProfileUser.email}
          fallbackRole={
            selectedProfileUser.teamMembers?.[0]?.role ||
            (selectedProfileUser.platformAdmin ? 'SUPER_ADMIN' : 'TEAM_MEMBER')
          }
        />
      )}
    </div>
  );
}

