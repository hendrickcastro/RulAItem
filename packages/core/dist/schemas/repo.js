"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRepoSchema = exports.CreateRepoSchema = exports.RepoSchema = void 0;
const zod_1 = require("zod");
exports.RepoSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    name: zod_1.z.string().min(1, "El nombre es requerido"),
    owner: zod_1.z.string().min(1, "El propietario es requerido"),
    url: zod_1.z.string().url("Debe ser una URL válida"),
    branch: zod_1.z.string().default('main'),
    userId: zod_1.z.string(),
    githubId: zod_1.z.number(),
    defaultBranch: zod_1.z.string(),
    isPrivate: zod_1.z.boolean().default(false),
    webhookId: zod_1.z.number().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.CreateRepoSchema = exports.RepoSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.UpdateRepoSchema = exports.RepoSchema.partial().omit({
    id: true,
    userId: true,
    createdAt: true
});
//# sourceMappingURL=repo.js.map