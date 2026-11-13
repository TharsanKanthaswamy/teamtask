'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teamId?: string;
  memberId?: string;
  userId?: string;
  fallbackName?: string;
  fallbackEmail?: string;
  fallbackRole?: string;
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
}: UserProfileDialogProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROJECTS' | 'TASKS' | 'ACTIVITY'>('OVERVIEW');

  const targetUserId = userId || memberId;

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

  if (!isOpen) return null;

  const profile = data?.data;
  const user = profile?.user || { name: fallbackName || 'User', email: fallbackEmail || '' };
  const member = profile?.member || { role: fallbackRole || 'TEAM_MEMBER' };
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
      {/* Solid Opaque Card (never translucent glass over black backdrop) */}
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
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-success ring-2 ring-card" />
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {user.name}
                </h2>
                {user.platformAdmin ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold border border-primary/25">
                    <ShieldAlert className="h-3 w-3" />
                    Platform Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                    <Shield className="h-3 w-3" />
                    {member.role === 'TEAM_LEAD' ? 'Team Lead' : 'Team Member'}
                  </span>
                )}
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

                {member.joinedAt && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-2 border-b border-border/60 text-xs font-medium bg-card">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3.5 py-2.5 border-b-2 font-semibold transition-colors ${
              activeTab === 'OVERVIEW'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview & Teams
          </button>
          <button
            onClick={() => setActiveTab('PROJECTS')}
            className={`px-3.5 py-2.5 border-b-2 font-semibold transition-colors ${
              activeTab === 'PROJECTS'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Projects ({allProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('TASKS')}
            className={`px-3.5 py-2.5 border-b-2 font-semibold transition-colors ${
              activeTab === 'TASKS'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Assigned Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('ACTIVITY')}
            className={`px-3.5 py-2.5 border-b-2 font-semibold transition-colors ${
              activeTab === 'ACTIVITY'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Contributions ({recentContributions.length})
          </button>
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
                              <div className="font-bold text-sm text-foreground">
                                {t.team?.name}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                /{t.team?.slug}
                              </div>
                            </div>
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                t.role === 'TEAM_LEAD'
                                  ? 'bg-primary/15 text-primary border border-primary/25'
                                  : 'bg-muted text-foreground border border-border'
                              }`}
                            >
                              {t.role === 'TEAM_LEAD' ? 'Team Lead' : 'Member'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-primary" />
                      Member Summary
                    </h3>
                    <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-muted-foreground">Account Status:</span>
                        <span className="font-bold text-success capitalize bg-success/15 px-2.5 py-0.5 rounded-full border border-success/30">
                          {user.status?.toLowerCase() || 'active'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-muted-foreground">Active Team:</span>
                        <span className="font-semibold text-foreground">{profile?.team?.name || 'Assigned Team'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-muted-foreground">Team Role:</span>
                        <span className="font-semibold text-primary">{member.role === 'TEAM_LEAD' ? 'Team Lead' : 'Team Member'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-muted-foreground">Total Lifetime Contributions:</span>
                        <span className="font-semibold text-foreground">{stats.contributionsCount} logs recorded</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Projects */}
              {activeTab === 'PROJECTS' && (
                <div className="space-y-3">
                  {allProjects.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Folder className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">No active project assignments found for this member.</p>
                    </div>
                  ) : (
                    allProjects.map((p: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-border bg-muted/30 flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                            <span>{p.name}</span>
                            {p.isLead && (
                              <span className="text-[11px] bg-primary/15 text-primary px-2 py-0.5 rounded font-semibold border border-primary/25">
                                Project Lead
                              </span>
                            )}
                          </div>
                          {p.responsibility && (
                            <p className="text-xs text-muted-foreground">
                              Role: {p.responsibility}
                            </p>
                          )}
                        </div>

                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            p.status === 'COMPLETED'
                              ? 'bg-success/15 text-success'
                              : 'bg-primary/15 text-primary'
                          }`}
                        >
                          {p.status || 'ACTIVE'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Tasks */}
              {activeTab === 'TASKS' && (
                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">No tasks currently assigned to this member.</p>
                    </div>
                  ) : (
                    tasks.map((task: any) => (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-xl border border-border bg-muted/30 flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-sm text-foreground">
                            {task.title}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{task.project?.name || 'Project'}</span>
                            {task.dueDate && (
                              <>
                                <span>•</span>
                                <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            task.status === 'COMPLETED'
                              ? 'bg-success/15 text-success'
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
