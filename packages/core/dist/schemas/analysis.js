"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisJobSchema = exports.CreateAnalysisSchema = exports.AnalysisSchema = void 0;
const zod_1 = require("zod");
exports.AnalysisSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    repoId: zod_1.z.string(),
    commitSha: zod_1.z.string(),
    branch: zod_1.z.string(),
    status: zod_1.z.enum(['pending', 'processing', 'completed', 'failed']),
    author: zod_1.z.object({
        name: zod_1.z.string(),
        email: zod_1.z.string().email(),
        username: zod_1.z.string().optional()
    }),
    message: zod_1.z.string(),
    documentation: zod_1.z.string().optional(),
    metrics: zod_1.z.object({
        linesAdded: zod_1.z.number(),
        linesRemoved: zod_1.z.number(),
        filesModified: zod_1.z.number(),
        complexity: zod_1.z.number().optional(),
        testCoverage: zod_1.z.number().optional()
    }).optional(),
    processingTime: zod_1.z.number().optional(),
    error: zod_1.z.string().optional(),
    queuedAt: zod_1.z.date(),
    startedAt: zod_1.z.date().optional(),
    completedAt: zod_1.z.date().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.CreateAnalysisSchema = exports.AnalysisSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.AnalysisJobSchema = zod_1.z.object({
    analysisId: zod_1.z.string(),
    repoId: zod_1.z.string(),
    commitSha: zod_1.z.string(),
    repoUrl: zod_1.z.string(),
    branch: zod_1.z.string(),
    author: zod_1.z.object({
        name: zod_1.z.string(),
        email: zod_1.z.string().email(),
        username: zod_1.z.string().optional()
    }),
    message: zod_1.z.string(),
    timestamp: zod_1.z.string(),
    priority: zod_1.z.enum(['low', 'normal', 'high']).default('normal')
});
//# sourceMappingURL=analysis.js.map