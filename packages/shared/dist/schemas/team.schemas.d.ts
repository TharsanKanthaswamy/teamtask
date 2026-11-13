import { z } from 'zod';
export declare const createTeamSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    description?: string | undefined;
}, {
    name: string;
    slug: string;
    description?: string | undefined;
}>;
export declare const updateTeamSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
}>;
export declare const addTeamMemberSchema: z.ZodObject<{
    userId: z.ZodString;
    role: z.ZodEnum<["TEAM_LEAD", "TEAM_MEMBER"]>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    role: "TEAM_LEAD" | "TEAM_MEMBER";
}, {
    userId: string;
    role: "TEAM_LEAD" | "TEAM_MEMBER";
}>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;
//# sourceMappingURL=team.schemas.d.ts.map