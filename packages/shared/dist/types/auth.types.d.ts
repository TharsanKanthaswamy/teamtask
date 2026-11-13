import { AdminLevel, TeamRole } from './user.types';
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    success: boolean;
    redirectTo: string;
    user: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
    };
    sessionToken?: string;
}
export interface AuthContext {
    userId: string;
    email: string;
    isAdmin: boolean;
    adminLevel?: AdminLevel;
}
export interface TenantContext {
    teamId: string;
    role: TeamRole;
    userId: string;
}
export interface SessionData {
    userId: string;
    email: string;
    isAdmin: boolean;
    createdAt: Date;
}
//# sourceMappingURL=auth.types.d.ts.map