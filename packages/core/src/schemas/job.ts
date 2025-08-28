import { z } from 'zod';

export const JobSchema = z.object({
  id: z.string().cuid(),
  type: z.enum(['code_analysis', 'repo_sync', 'webhook_process']),
  status: z.enum(['queued', 'processing', 'completed', 'failed', 'retrying']),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  payload: z.record(z.any()),
  result: z.record(z.any()).optional(),
  error: z.string().optional(),
  attempts: z.number().default(0),
  maxAttempts: z.number().default(3),
  queuedAt: z.date(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const CreateJobSchema = JobSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type Job = z.infer<typeof JobSchema>;
export type CreateJobData = z.infer<typeof CreateJobSchema>;
