'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, UserX, Mail, Crown, Users, AtSign, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { UserProfileDialog } from '@/components/members/user-profile-dialog';

interface ProjectMembersProps {
  teamId: string;
  projectId: string;
  members: any[];
  project: any;
  onUpdate: () => void;
}

export function ProjectMembers({ teamId, projectId, members, project, onUpdate }: ProjectMembersProps) {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMethod, setAddMethod] = useState<'SELECT' | 'EMAIL'>('SELECT');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [responsibility, setResponsibility] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedMemberForProfile, setSelectedMemberForProfile] = useState<any | null>(null);

  // Fetch both team members and newly account-created users across platform
  const { data: availableData, isLoading: loadingAvailable, refetch: refetchAvailable } = useQuery<any>({
    queryKey: ['available-project-members', teamId, projectId],
    queryFn: () => api.projectMembers.getAvailable(teamId, projectId),
    enabled: isAddingMember,
  });

  const teamMembersList = availableData?.data?.teamMembers || [];
  const otherUsersList = availableData?.data?.otherUsers || [];

  const addMutation = useMutation({
    mutationFn: (data: { teamMemberId?: string; userId?: string; email?: string; responsibility?: string }) =>
      api.projectMembers.add(teamId, projectId, data),
    onSuccess: () => {
      onUpdate();
      refetchAvailable();
      setIsAddingMember(false);
      setSelectedTarget('');
      setEmailInput('');
      setResponsibility('');
      setErrorMessage('');
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to add member to project');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) =>
      api.projectMembers.remove(teamId, projectId, memberId),
    onSuccess: () => {
      onUpdate();
      refetchAvailable();
    },
  });

  const handleAddMember = () => {
    setErrorMessage('');

    if (addMethod === 'SELECT') {
      if (!selectedTarget) {
        setErrorMessage('Please select a member or user from the list.');
        return;
      }

      const [type, id] = selectedTarget.split(':');
      if (type === 'teamMember') {
        addMutation.mutate({
          teamMemberId: id,
          responsibility: responsibility.trim() || undefined,
        });
      } else if (type === 'user') {
        addMutation.mutate({
          userId: id,
          responsibility: responsibility.trim() || undefined,
        });
      }
    } else {
      if (!emailInput.trim() || !emailInput.includes('@')) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }

      addMutation.mutate({
        email: emailInput.trim(),
        responsibility: responsibility.trim() || undefined,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Member Card */}
      <GlassCard variant="elevated" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Add Member</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAddingMember(!isAddingMember);
              setErrorMessage('');
            }}
            className="button-press gap-2"
          >
            <Plus className="h-4 w-4" />
            {isAddingMember ? 'Cancel' : 'Add Member'}
          </Button>
        </div>

        {isAddingMember && (
          <div className="space-y-4 pt-2">
            {/* Method Toggle Buttons */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/40 border border-border w-fit text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setAddMethod('SELECT');
                  setErrorMessage('');
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  addMethod === 'SELECT'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Select from Registered Users
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddMethod('EMAIL');
                  setErrorMessage('');
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  addMethod === 'EMAIL'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <AtSign className="h-3.5 w-3.5" />
                Add using Mail
              </button>
            </div>

            {/* Error Feedback */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2 animate-fade-in">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Field A: Select User Dropdown */}
            {addMethod === 'SELECT' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Team Member or Registered User</label>
                {loadingAvailable ? (
                  <div className="h-10 px-3 rounded-lg border border-border bg-background-elevated flex items-center text-xs text-muted-foreground gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    Loading available users...
                  </div>
                ) : (
                  <select
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background-elevated text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Choose a member or newly created account...</option>

                    {/* Group 1: Team Members */}
                    {teamMembersList.length > 0 && (
                      <optgroup label="Team Members">
                        {teamMembersList.map((member: any) => (
                          <option key={member.teamMemberId} value={`teamMember:${member.teamMemberId}`}>
                            {member.name} ({member.role === 'TEAM_LEAD' ? 'Team Lead' : 'Member'}) — {member.email}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {/* Group 2: Other Registered Platform Users (New Accounts) */}
                    {otherUsersList.length > 0 && (
                      <optgroup label="Newly Account-Created Users (Add & Join Team)">
                        {otherUsersList.map((user: any) => (
                          <option key={user.userId} value={`user:${user.userId}`}>
                            {user.name} {user.isAdmin ? '★ Superadmin' : '(New User)'} — {user.email}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {teamMembersList.length === 0 && otherUsersList.length === 0 && (
                      <option disabled value="">
                        All registered users are already in this project
                      </option>
                    )}
                  </select>
                )}
                <p className="text-xs text-muted-foreground">
                  Selecting a newly account-created user will automatically add them to the team and this project.
                </p>
              </div>
            ) : (
              /* Field B: Add by Mail */
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-primary" />
                  User Email Address
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g., alex@company.com"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background-elevated text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Enter any user's email address. If they already created an account, they'll be added immediately; otherwise an account will be provisioned for them.
                </p>
              </div>
            )}

            {/* Responsibility Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Responsibility (optional)</label>
              <input
                type="text"
                value={responsibility}
                onChange={(e) => setResponsibility(e.target.value)}
                placeholder="e.g., Frontend Developer, Lead Designer"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background-elevated text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button
              onClick={handleAddMember}
              disabled={
                addMutation.isPending ||
                (addMethod === 'SELECT' && !selectedTarget) ||
                (addMethod === 'EMAIL' && !emailInput.trim())
              }
              className="button-press w-full font-semibold"
            >
              {addMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding to Project...
                </span>
              ) : (
                'Add to Project'
              )}
            </Button>
          </div>
        )}
      </GlassCard>

      {/* Members List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Project Members ({members.length})</h3>
        <div className="space-y-3">
          {members.map((member: any) => {
            const isLead = member.teamMemberId === project.projectLeadId;

            return (
              <GlassCard
                key={member.id}
                variant="elevated"
                className="p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => setSelectedMemberForProfile(member)}
                    className="flex items-center gap-4 cursor-pointer group flex-1"
                    title="Click to view full profile"
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex items-center justify-center">
                      <span className="text-lg font-medium text-primary group-hover:text-primary-foreground">
                        {member.teamMember.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {member.teamMember.user.name}
                        </p>
                        {isLead && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            <Crown className="h-3 w-3" />
                            Project Lead
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {member.teamMember.user.email}
                      </div>
                      {member.responsibility && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {member.responsibility}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isLead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMutation.mutate(member.id)}
                      disabled={removeMutation.isPending}
                      className="button-press text-destructive hover:text-destructive hover:bg-destructive/10 ml-3"
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* User Profile Modal */}
      {selectedMemberForProfile && (
        <UserProfileDialog
          isOpen={!!selectedMemberForProfile}
          onClose={() => setSelectedMemberForProfile(null)}
          teamId={teamId}
          memberId={selectedMemberForProfile.teamMemberId || selectedMemberForProfile.id}
          userId={selectedMemberForProfile.teamMember?.user?.id}
          fallbackName={selectedMemberForProfile.teamMember?.user?.name}
          fallbackEmail={selectedMemberForProfile.teamMember?.user?.email}
          fallbackRole={selectedMemberForProfile.teamMember?.role}
        />
      )}
    </div>
  );
}
