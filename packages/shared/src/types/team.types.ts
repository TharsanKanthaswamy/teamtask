import { TeamRole, User, UserStatus } from './user.types';

export enum TeamStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: TeamStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  status: UserStatus;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
  leadCount: number;
  memberCount: number;
}
