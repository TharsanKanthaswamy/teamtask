"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTeamMemberSchema = exports.updateTeamSchema = exports.createTeamSchema = void 0;
const zod_1 = require("zod");
exports.createTeamSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Team name must be at least 2 characters'),
    slug: zod_1.z
        .string()
        .min(2)
        .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    description: zod_1.z.string().optional(),
});
exports.updateTeamSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    description: zod_1.z.string().optional(),
});
exports.addTeamMemberSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    role: zod_1.z.enum(['TEAM_LEAD', 'TEAM_MEMBER']),
});
//# sourceMappingURL=team.schemas.js.map