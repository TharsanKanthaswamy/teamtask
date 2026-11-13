'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Mail,
  Calendar,
  Shield,
  ShieldAlert,
  Building2,
  Folder,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  Activity,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Settings,
  KeyRound,
  Trash2,
  UserCheck,
  UserX,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teamId?: string;
  memberId?: string;
  userId?: string;
  fallbackName?: string;
  fallbackEmail?: string;
  fallbackRole?: string;
  initialTab?: 'OVERVIEW' | 'PROJECTS' | 'TASKS' | 'ACTIVITY' | 'MANAGE';
}

export function UserProfileDialog({
  isOpen,
  onClose,
  teamId,
  memberId,
  userId,
  fallbackName,
  fallbackEmail,
  fallbackRole,
  initialTab = 'OVERVIEW',
}: UserProfileDialogProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROJECTS' | 'TASKS' | 'ACTIVITY' | 'MANAGE'>(initialTab);

  // Superadmin management state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [newPassword, setNewPassword] = useState('');
  const [assignTeamId, setAssignTeamId] = useState('');
  const [assignRole, setAssignRole] = useState<'TEAM_LEAD' | 'TEAM_MEMBER'>('TEAM_MEMBER');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const targetUserId = userId || memberId;

  // Check viewer admin permissions
  const { data: authData } = useQuery<any>({
    queryKey: ['auth-verify'],
    queryFn: () => api.auth.verify(),
  });
  const isViewerAdmin = !!authData?.user?.isAdmin;

  // Fetch target profile
  const { data, isLoading } = useQuery<any>({
    queryKey: ['member-profile', teamId, memberId, targetUserId],
    queryFn: () => {
      if (teamId && memberId) {
        return api.teams.getMemberProfile(teamId, memberId);
      }
      return api.platformAdmin.getUserProfile(targetUserId!);
    },
    enabled: isOpen && (!!(teamId && memberId) || !!targetUserId),
  });

  // Fetch all teams for team assignment
  const { data: allTeamsData } = useQuery<any>({
    queryKey: ['admin-teams-list'],
    queryFn: () => api.teams.list(),
    enabled: isOpen && isViewerAdmin,
  });
  const allTeams = allTeamsData?.data || [];

  const profile = data?.data;
  const user = profile?.user || { id: targetUserId, name: fallbackName || 'User', email: fallbackEmail || '', status: 'ACTIVE' };
  const member = profile?.member || { role: fallbackRole || 'TEAM_MEMBER' };
  const isTargetSuperAdmin = !!user.platformAdmin?.enabled;

  // Populate form fields when profile loads
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setEditStatus(user.status || 'ACTIVE');
    }
  }, [user?.name, user?.email, user?.status]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: () =>
      api.platformAdmin.updateUser(targetUserId!, {
        name: editName.trim(),
        email: editEmail.trim(),
        status: editStatus,
      }),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Profile details updated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['member-profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: (newRole: 'SUPER_ADMIN' | 'MEMBER') =>
      api.platformAdmin.setUserRole(targetUserId!, newRole),
    onSuccess: (_, newRole) => {
      const msg = newRole === 'SUPER_ADMIN'
        ? 'User successfully promoted to Super Administrator!'
        : 'User privileges updated to Standard Member.';
      setFeedback({ type: 'success', message: msg });
      queryClient.invalidateQueries({ queryKey: ['member-profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message || 'Failed to update role.' });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => api.platformAdmin.setUserPassword(targetUserId!, newPassword),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'Password updated successfully! All previous sessions terminated.' });
      setNewPassword('');
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message || 'Failed to update password.' });
    },
  });

  const assignTeamMutation = useMutation({
    mutationFn: () => api.platformAdmin.assignUserToTeam(targetUserId!, assignTeamId, assignRole),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'User assigned to team successfully!' });
      setAssignTeamId('');
      queryClient.invalidateQueries({ queryKey: ['member-profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message || 'Failed to assign team.' });
    },
  });

  const removeTeamMutation = useMutation({
    mutationFn: (tId: string) => api.platformAdmin.removeUserFromTeam(targetUserId!, tId),
    onSuccess: () => {
      setFeedback({ type: 'success', message: 'User removed from team.' });
      queryClient.invalidateQueries({ queryKey: ['member-profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message || 'Failed to remove from team.' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: () => api.platformAdmin.deleteUser(targetUserId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onClose();
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete user.' });
      setConfirmDelete(false);
    },
  });

  if (!isOpen) return null;

  const stats = profile?.stats || {
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalHoursLogged: 0,
    contributionsCount: 0,
  };
  const teams = profile?.teams || [];
  const ledProjects = profile?.ledProjects || [];
  const participatingProjects = profile?.participatingProjects || [];
  const allProjects = [
    ...ledProjects.map((p: any) => ({ ...p, isLead: true })),
    ...participatingProjects.map((pm: any) => ({ ...pm.project, isLead: false, responsibility: pm.responsibility })),
  ];
  const tasks = profile?.tasks || [];
  const recentContributions = profile?.recentContributions || [];

  const handleCopyEmail = () => {
    if (user.email) {
      navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card text-card-foreground border border-border shadow-2xl flex flex-col z-10">
        
        {/* Header section with cover & avatar */}
        <div className="relative p-6 pb-5 border-b border-border/60 bg-muted/20">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl shadow-md">
                {user.name?.slice(0, 2).toUpperCase() || 'U'}
              </div>
              <span
                className={`absolute bottom-0 right-0 h-4 w-4 rounded-full ring-2 ring-card ${
                  user.status === 'ACTIVE' ? 'bg-success' : 'bg-destructive'
                }`}
                title={`Status: ${user.status}`}
              />
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {user.name}
                </h2>
                {isTargetSuperAdmin ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold border border-primary/25">
                    <ShieldAlert className="h-3 w-3" />
                    Super Administrator
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-muted text-foreground font-semibold border border-border">
                    <Shield className="h-3 w-3" />
                    {member.role === 'TEAM_LEAD' ? 'Team Lead' : 'Team Member'}
                  </span>
                )}

                <span
                  className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                    user.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {user.status}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium flex-wrap">
                <button
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors group"
                  title="Click to copy email"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                  <span>{user.email}</span>
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-success ml-0.5" />
                  ) : (
                    <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
                  )}
                </button>

                {user.createdAt && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action for Superadmin */}
            {isViewerAdmin && (
              <div className="flex sm:flex-col items-center gap-2 mt-2 sm:mt-0">
                <Button
                  size="sm"
                  variant={isTargetSuperAdmin ? 'outline' : 'default'}
                  onClick={() => toggleAdminMutation.mutate(isTargetSuperAdmin ? 'MEMBER' : 'SUPER_ADMIN')}
                  disabled={toggleAdminMutation.isPending}
                  className="h-8 text-xs gap-1.5 font-semibold"
                >
                  {toggleAdminMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldAlert className="h-3.5 w-3.5" />
                  )}
                  {isTargetSuperAdmin ? 'Demote to Member' : 'Make Superadmin'}
                </Button>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-border/50 text-center">
            <div className="p-3 rounded-xl bg-card border border-border shadow-sm">
              <div className="text-xl font-bold text-foreground">{stats.completedTasks}</div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">Tasks Done</div>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border shadow-sm">
              <div className="text-xl font-bold text-primary">{stats.activeTasks}</div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">In Progress</div>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border shadow-sm">
              <div className="text-xl font-bold text-foreground">{stats.totalHoursLogged}h</div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">Hours Logged</div>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border shadow-sm">
              <div className="text-xl font-bold text-foreground">{allProjects.length}</div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">Projects</div>
            </div>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs font-medium flex items-center justify-between animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-destructive/10 border border-destructive/30 text-destructive'
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-2 border-b border-border/60 text-xs font-medium bg-card overflow-x-auto">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3.5 py-2.5 border-b-2 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'OVERVIEW'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview & Teams
          </button>
          <button
            onClick={() => setActiveTab('PROJECTS')}
            className={`px-3.5 py-2.5 border-b-2 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'PROJECTS'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Projects ({allProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('TASKS')}
            className={`px-3.5 py-2.5 border-b-2 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'TASKS'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Assigned Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('ACTIVITY')}
            className={`px-3.5 py-2.5 border-b-2 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'ACTIVITY'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Contributions ({recentContributions.length})
          </button>

          {isViewerAdmin && (
            <button
              onClick={() => setActiveTab('MANAGE')}
              className={`px-3.5 py-2.5 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'MANAGE'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-primary/80 hover:text-primary'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              Superadmin Controls
            </button>
          )}
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-4 flex-1 bg-card">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              Loading member details...
            </div>
          ) : (
            <>
              {/* Tab 1: Overview & Teams */}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-primary" />
                      Team Memberships
                    </h3>
                    {teams.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No teams assigned yet.</p>
                    ) : (
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {teams.map((t: any) => (
                          <div
                            key={t.id}
                            className="p-3.5 rounded-xl border border-border bg-muted/30 flex items-center justify-between"
                          >
                            <div className="space-y-0.5">
                              <div className="font-semibold text-xs text-foreground">
                                {t.team?.name || 'Unnamed Team'}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                Role:{' '}
                                <span className="font-medium text-foreground">
                                  {t.role === 'TEAM_LEAD' ? 'Team Lead' : 'Team Member'}
                                </span>
                              </div>
                            </div>
                            {isViewerAdmin && (
                              <button
                                onClick={() => removeTeamMutation.mutate(t.team?.id)}
                                disabled={removeTeamMutation.isPending}
                                className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors text-xs"
                                title="Remove from this team"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Team Assignment for Super Admin */}
                  {isViewerAdmin && (
                    <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                      <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Plus className="h-3.5 w-3.5 text-primary" />
                        Assign to New Team
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={assignTeamId}
                          onChange={(e) => setAssignTeamId(e.target.value)}
                          className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">Select a team...</option>
                          {allTeams.map((t: any) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={assignRole}
                          onChange={(e) => setAssignRole(e.target.value as any)}
                          className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="TEAM_MEMBER">Team Member</option>
                          <option value="TEAM_LEAD">Team Lead</option>
                        </select>
                        <Button
                          size="sm"
                          onClick={() => assignTeamMutation.mutate()}
                          disabled={!assignTeamId || assignTeamMutation.isPending}
                          className="h-9 px-4 text-xs font-semibold"
                        >
                          {assignTeamMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Assign'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Projects */}
              {activeTab === 'PROJECTS' && (
                <div className="space-y-3">
                  {allProjects.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Folder className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Not assigned to any projects currently.</p>
                    </div>
                  ) : (
                    allProjects.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-xl border border-border bg-muted/30 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            <Folder className="h-3.5 w-3.5 text-primary" />
                            {p.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Status: <span className="font-medium text-foreground">{p.status}</span>
                            {p.isLead && (
                              <span className="ml-2 font-semibold text-primary">★ Project Lead</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Tasks */}
              {activeTab === 'TASKS' && (
                <div className="space-y-2.5">
                  {tasks.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">No tasks currently assigned.</p>
                    </div>
                  ) : (
                    tasks.map((task: any) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-medium text-foreground">{task.title}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {task.project?.name || 'Project'} • Priority: {task.priority}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            task.status === 'COMPLETED'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-primary/15 text-primary'
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 4: Contributions */}
              {activeTab === 'ACTIVITY' && (
                <div className="space-y-3">
                  {recentContributions.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">No contribution logs submitted yet.</p>
                    </div>
                  ) : (
                    recentContributions.map((contrib: any) => (
                      <div
                        key={contrib.id}
                        className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">
                            {contrib.taskTitle || 'Task Contribution'}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(contrib.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {contrib.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs font-mono text-primary font-semibold pt-0.5">
                          <span>{contrib.hoursSpent}h logged</span>
                          <span>•</span>
                          <span>{contrib.progressPercent}% progress</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 5: SUPERADMIN MANAGEMENT CONTROLS */}
              {activeTab === 'MANAGE' && isViewerAdmin && (
                <div className="space-y-5">
                  {/* Card 1: Platform Role & Promotion */}
                  <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          <ShieldAlert className="h-4 w-4 text-primary" />
                          Platform Superadmin Privileges
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isTargetSuperAdmin
                            ? 'This account has full unrestricted Superadmin access across all teams, projects, and users.'
                            : 'This account currently has standard member permissions.'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={isTargetSuperAdmin ? 'destructive' : 'default'}
                        onClick={() => toggleAdminMutation.mutate(isTargetSuperAdmin ? 'MEMBER' : 'SUPER_ADMIN')}
                        disabled={toggleAdminMutation.isPending}
                        className="h-8 text-xs font-semibold gap-1.5"
                      >
                        {toggleAdminMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ShieldAlert className="h-3.5 w-3.5" />
                        )}
                        {isTargetSuperAdmin ? 'Revoke Superadmin Role' : 'Promote to Superadmin'}
                      </Button>
                    </div>
                  </div>

                  {/* Card 2: Account Details & Status */}
                  <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-primary" />
                      Edit User Profile & Status
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-name" className="text-xs font-medium">
                          Full Name
                        </Label>
                        <Input
                          id="edit-name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-9 text-xs bg-background"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-email" className="text-xs font-medium">
                          Email Address
                        </Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="h-9 text-xs bg-background"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-status" className="text-xs font-medium">
                        Account Status
                      </Label>
                      <select
                        id="edit-status"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="ACTIVE">ACTIVE (Normal Access)</option>
                        <option value="INACTIVE">INACTIVE (Disabled)</option>
                        <option value="SUSPENDED">SUSPENDED (Blocked Access)</option>
                      </select>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => updateProfileMutation.mutate()}
                      disabled={updateProfileMutation.isPending || !editName.trim() || !editEmail.trim()}
                      className="h-8 text-xs font-semibold px-4"
                    >
                      {updateProfileMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Profile Changes'}
                    </Button>
                  </div>

                  {/* Card 3: Direct Password Override */}
                  <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <KeyRound className="h-4 w-4 text-primary" />
                      Direct Password Override
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      As Superadmin, you can set a new password directly for this user. This will terminate all their active sessions.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="password"
                        placeholder="Enter new password (min 8 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-9 text-xs bg-background flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => resetPasswordMutation.mutate()}
                        disabled={newPassword.length < 8 || resetPasswordMutation.isPending}
                        className="h-9 text-xs font-semibold px-4 whitespace-nowrap"
                      >
                        {resetPasswordMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Set Password'}
                      </Button>
                    </div>
                  </div>

                  {/* Card 4: Danger Zone - Delete Account */}
                  <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-3">
                    <h4 className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Danger Zone
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Permanently delete this user, removing all their assignments, memberships, and sessions.
                    </p>
                    {confirmDelete ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-destructive font-semibold">Are you absolutely sure?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteUserMutation.mutate()}
                          disabled={deleteUserMutation.isPending}
                          className="h-8 text-xs font-semibold"
                        >
                          {deleteUserMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Yes, Delete User'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDelete(false)}
                          className="h-8 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setConfirmDelete(true)}
                        className="h-8 text-xs font-semibold gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete User Account
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/60 flex justify-end bg-muted/20">
          <Button variant="default" onClick={onClose} className="font-semibold text-xs px-6 shadow-sm">
            Close Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
