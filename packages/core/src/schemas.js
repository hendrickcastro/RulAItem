"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateContextoSchema = exports.CreateContextoSchema = exports.WebhookEventSchema = exports.JobSchema = exports.AnalysisSchema = exports.CommitSchema = exports.ContextoSchema = exports.UserSchema = void 0;
const zod_1 = require("zod");
// Base schemas
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(1),
    avatar: zod_1.z.string().url().optional(),
    githubId: zod_1.z.string(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.ContextoSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    nombre: zod_1.z.string().min(5, "El nombre debe tener al menos 5 caracteres"),
    descripcion: zod_1.z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
    repoUrl: zod_1.z.string().url("Debe ser una URL de repositorio válida"),
    responsableId: zod_1.z.string().cuid(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    isActive: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.CommitSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    contextoId: zod_1.z.string().cuid(),
    sha: zod_1.z.string(),
    message: zod_1.z.string(),
    author: zod_1.z.object({
        name: zod_1.z.string(),
        email: zod_1.z.string().email(),
    }),
    date: zod_1.z.date(),
    filesChanged: zod_1.z.array(zod_1.z.string()),
    additions: zod_1.z.number().int().min(0),
    deletions: zod_1.z.number().int().min(0),
    createdAt: zod_1.z.date(),
});
exports.AnalysisSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    commitId: zod_1.z.string().cuid(),
    summary: zod_1.z.string(),
    impact: zod_1.z.enum(['low', 'medium', 'high']),
    complexity: zod_1.z.enum(['simple', 'moderate', 'complex']),
    patterns: zod_1.z.array(zod_1.z.string()),
    suggestions: zod_1.z.array(zod_1.z.string()),
    codeQuality: zod_1.z.number().min(0).max(10),
    createdAt: zod_1.z.date(),
});
exports.JobSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    type: zod_1.z.enum(['analyze_commit', 'analyze_repo', 'generate_docs']),
    status: zod_1.z.enum(['pending', 'processing', 'completed', 'failed']),
    payload: zod_1.z.record(zod_1.z.any()),
    result: zod_1.z.record(zod_1.z.any()).optional(),
    error: zod_1.z.string().optional(),
    attempts: zod_1.z.number().int().min(0).default(0),
    maxAttempts: zod_1.z.number().int().min(1).default(3),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
    completedAt: zod_1.z.date().optional(),
});
exports.WebhookEventSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    source: zod_1.z.enum(['github', 'gitlab', 'bitbucket']),
    event: zod_1.z.string(),
    payload: zod_1.z.record(zod_1.z.any()),
    processed: zod_1.z.boolean().default(false),
    createdAt: zod_1.z.date(),
});
// Form schemas (for validation)
exports.CreateContextoSchema = exports.ContextoSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.UpdateContextoSchema = exports.CreateContextoSchema.partial();
//# sourceMappingURL=schemas.js.map