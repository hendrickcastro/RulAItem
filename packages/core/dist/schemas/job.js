"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateJobSchema = exports.JobSchema = void 0;
const zod_1 = require("zod");
exports.JobSchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    type: zod_1.z.enum(['code_analysis', 'repo_sync', 'webhook_process']),
    status: zod_1.z.enum(['queued', 'processing', 'completed', 'failed', 'retrying']),
    priority: zod_1.z.enum(['low', 'normal', 'high']).default('normal'),
    payload: zod_1.z.record(zod_1.z.any()),
    result: zod_1.z.record(zod_1.z.any()).optional(),
    error: zod_1.z.string().optional(),
    attempts: zod_1.z.number().default(0),
    maxAttempts: zod_1.z.number().default(3),
    queuedAt: zod_1.z.date(),
    startedAt: zod_1.z.date().optional(),
    completedAt: zod_1.z.date().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.CreateJobSchema = exports.JobSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
//# sourceMappingURL=job.js.map