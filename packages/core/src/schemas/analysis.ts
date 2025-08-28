import { z } from 'zod';

export const AnalysisSchema = z.object({
  id: z.string().cuid(),
  repoId: z.string(),
  commitSha: z.string(),
  branch: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  author: z.object({
    name: z.string(),
    email: z.string().email(),
    username: z.string().optional()
  }),
  message: z.string(),
  documentation: z.string().optional(),
  metrics: z.object({
    linesAdded: z.number(),
    linesRemoved: z.number(),
    filesModified: z.number(),
    complexity: z.number().optional(),
    testCoverage: z.number().optional()
  }).optional(),
  processingTime: z.number().optional(),
  error: z.string().optional(),
  queuedAt: z.date(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const CreateAnalysisSchema = AnalysisSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const AnalysisJobSchema = z.object({
  analysisId: z.string(),
  repoId: z.string(),
  commitSha: z.string(),
  repoUrl: z.string(),
  branch: z.string(),
  author: z.object({
    name: z.string(),
    email: z.string().email(),
    username: z.string().optional()
  }),
  message: z.string(),
  timestamp: z.string(),
  priority: z.enum(['low', 'normal', 'high']).default('normal')
});

export type Analysis = z.infer<typeof AnalysisSchema>;
export type CreateAnalysisData = z.infer<typeof CreateAnalysisSchema>;
export type AnalysisJobData = z.infer<typeof AnalysisJobSchema>;
