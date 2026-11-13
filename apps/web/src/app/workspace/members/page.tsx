'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Mail, Shield, UserCheck, Search, Building2, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { UserProfileDialog } from '@/components/members/user-profile-dialog';

export default function WorkspaceMembersPage() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const { data: teamsData, isLoading: teamsLoading } = useQuery<any>({
    queryKey: ['user-teams'],
    queryFn: () => api.teams.list(),
  });

  const teams = teamsData?.data || [];
  const activeTeam = teams.find((t: any) => (t.id || t.teamId) === selectedTeamId) || teams[0];
  const teamId = activeTeam?.id || activeTeam?.teamId || '';
  const teamName = activeTeam?.name || activeTeam?.teamName || 'Team';

  const { data: membersData, isLoading: membersLoading } = useQuery<any>({
    queryKey: ['team-members', teamId],
    queryFn: () => api.teams.getMembers(teamId),
    enabled: !!teamId,
  });

  const members = membersData?.data || [];

  const filteredMembers = members.filter((m: any) => {
    const name = m.user?.name || m.name || '';
    const email = m.user?.email || m.email || '';
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (teamsLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground animate-pulse">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 gradient-mesh opacity-40" />

      <div className="space-y-6 p-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="display-text text-4xl font-semibold tracking-tight text-foreground">
              {teamName} Members
            </h1>
            <p className="body-text text-base text-muted-foreground mt-1">
              View team members, roles, assignments, and click to inspect full user profiles
            </p>
          </div>

          {/* Team Switcher if multiple teams exist */}
          {teams.length > 1 && (
            <div className="flex items-center gap-2 border border-border p-1.5 rounded-xl bg-card">
              <Building2 className="h-4 w-4 text-muted-foreground ml-1" />
              <select
                value={teamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="bg-transparent text-sm font-semibold text-foreground focus:outline-none cursor-pointer pr-2"
              >
                {teams.map((t: any) => {
                  const id = t.id || t.teamId;
                  const name = t.name || t.teamName;
                  return (
                    <option key={id} value={id} className="bg-background text-foreground">
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </header>

        {/* Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background text-foreground"
            />
          </div>

          <div className="text-xs text-muted-foreground font-medium">
            Showing {filteredMembers.length} of {members.length} member{members.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Members Grid */}
        {filteredMembers.length === 0 ? (
          <GlassCard variant="elevated" className="p-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-semibold text-foreground">No members found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? 'Try a different search term.' : 'This team has no registered members yet.'}
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member: any) => {
              const name = member.user?.name || member.name || 'User';
              const email = member.user?.email || member.email || '';
              const isLead = member.role === 'TEAM_LEAD';

              return (
                <GlassCard
                  key={member.id}
                  variant="elevated"
                  onClick={() => setSelectedMember(member)}
                  className="p-6 space-y-4 cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all group active:scale-[0.99] border border-border"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl glass-elevated flex items-center justify-center bg-primary/10 text-primary font-bold text-base border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                          <span>{name}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{email}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        isLead
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isLead ? 'Lead' : 'Member'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                    <span className="flex items-center gap-1 font-medium text-primary">
                      <Shield className="h-3.5 w-3.5" />
                      {isLead ? 'Team Lead' : 'Team Member'}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <UserCheck className="h-3.5 w-3.5" />
                      {member.status || 'ACTIVE'}
                    </span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedMember && (
        <UserProfileDialog
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          teamId={teamId}
          memberId={selectedMember.id}
          fallbackName={selectedMember.user?.name || selectedMember.name}
          fallbackEmail={selectedMember.user?.email || selectedMember.email}
          fallbackRole={selectedMember.role}
        />
      )}
    </div>
  );
}
