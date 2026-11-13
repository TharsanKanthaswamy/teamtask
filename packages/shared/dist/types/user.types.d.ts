export declare enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    SUSPENDED = "SUSPENDED"
}
export declare enum AdminLevel {
    SUPER_ADMIN = "SUPER_ADMIN"
}
export declare enum TeamRole {
    TEAM_LEAD = "TEAM_LEAD",
    TEAM_MEMBER = "TEAM_MEMBER"
}
export interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
}
export interface PlatformAdmin {
    id: string;
    userId: string;
    adminLevel: AdminLevel;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=user.types.d.ts.map