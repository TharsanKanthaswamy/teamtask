'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, UserX, Mail, Crown } from 'lucide-react';
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
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [responsibility, setResponsibility] = useState('');
  const [selectedMemberForProfile, setSelectedMemberForProfile] = useState<any | null>(null);

  const { data: teamMembers } = useQuery<any>({
    queryKey: ['team-members', teamId],
    queryFn: () => api.teams.getMembers(teamId),
  });

  const addMutation = useMutation({
    mutationFn: (data: { teamMemberId: string; responsibility?: string }) =>
      api.projectMembers.add(teamId, projectId, data),
    onSuccess: () => {
      onUpdate();
      setIsAddingMember(false);
      setSelectedMemberId('');
      setResponsibility('');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) =>
      api.projectMembers.remove(teamId, projectId, memberId),
    onSuccess: () => {
      onUpdate();
    },
  });

  const handleAddMember = () => {
    if (!selectedMemberId) return;

    addMutation.mutate({
      teamMemberId: selectedMemberId,
      responsibility: responsibility || undefined,
    });
  };

  const availableMembers = teamMembers?.data?.filter(
    (tm: any) => !members.some((m: any) => m.teamMemberId === tm.id)
  ) || [];

  return (
    <div className="space-y-6">
      {/* Add Member */}
      <GlassCard variant="elevated" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Member</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddingMember(!isAddingMember)}
            className="button-press gap-2"
          >
            <Plus className="h-4 w-4" />
            {isAddingMember ? 'Cancel' : 'Add Member'}
          </Button>
        </div>

        {isAddingMember && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Team Member</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Choose a member...</option>
                {availableMembers.map((member: any) => (
                  <option key={member.id} value={member.id}>
                    {member.user.name} ({member.role === 'TEAM_LEAD' ? 'Team Lead' : 'Member'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Responsibility (optional)</label>
              <input
                type="text"
                value={responsibility}
                onChange={(e) => setResponsibility(e.target.value)}
                placeholder="e.g., Frontend Developer"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <Button
              onClick={handleAddMember}
              disabled={!selectedMemberId || addMutation.isPending}
              className="button-press w-full"
            >
              {addMutation.isPending ? 'Adding...' : 'Add to Project'}
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
          fallbackName={selectedMemberForProfile.teamMember?.user?.name}
          fallbackEmail={selectedMemberForProfile.teamMember?.user?.email}
          fallbackRole={selectedMemberForProfile.teamMember?.role}
        />
      )}
    </div>
  );
}
