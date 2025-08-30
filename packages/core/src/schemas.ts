import { z } from 'zod';

// Date schema that accepts both Date objects and ISO strings
const DateSchema = z.union([
  z.date(),
  z.string().transform((val) => new Date(val))
]);

// Base schemas
export const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().min(1),
  avatar: z.string().url().optional(),
  githubId: z.string(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const ContextoSchema = z.object({
  id: z.string().cuid(),
  nombre: z.string().min(5, "El nombre debe tener al menos 5 caracteres"),
  descripcion: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  repoUrl: z.string().url("Debe ser una URL de repositorio válida"),
  branch: z.string().min(1, "La rama es requerida").default("main"),
  responsableId: z.string().cuid(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  // AI-generated fields
  aiDescription: z.string().optional(), // AI-generated project description
  projectStructure: z.record(z.any()).optional(), // Project structure analysis
  lastAnalysisAt: DateSchema.optional(), // Last time the project was analyzed
  // Metadata
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

export const CommitSchema = z.object({
  id: z.string().cuid(),
  contextoId: z.string().cuid(),
  sha: z.string(),
  message: z.string(),
  author: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  date: DateSchema,
  filesChanged: z.array(z.string()),
  additions: z.number().int().min(0),
  deletions: z.number().int().min(0),
  createdAt: DateSchema,
});

export const AnalysisSchema = z.object({
  id: z.string().cuid(),
  commitId: z.string().cuid(),
  summary: z.string(),
  impact: z.enum(['low', 'medium', 'high']),
  complexity: z.enum(['simple', 'moderate', 'complex']),
  patterns: z.array(z.string()),
  suggestions: z.array(z.string()),
  codeQuality: z.number().min(0).max(10),
  createdAt: DateSchema,
});

export const JobSchema = z.object({
  id: z.string().cuid(),
  type: z.enum(['analyze_commit', 'analyze_repo', 'generate_docs']),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  payload: z.record(z.any()),
  result: z.record(z.any()).optional(),
  error: z.string().optional(),
  attempts: z.number().int().min(0).default(0),
  maxAttempts: z.number().int().min(1).default(3),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  completedAt: DateSchema.optional(),
});

export const WebhookEventSchema = z.object({
  id: z.string().cuid(),
  source: z.enum(['github', 'gitlab', 'bitbucket']),
  event: z.string(),
  payload: z.record(z.any()),
  processed: z.boolean().default(false),
  createdAt: DateSchema,
});

// Type inference
export type User = z.infer<typeof UserSchema>;
export type Contexto = z.infer<typeof ContextoSchema>;
export type Commit = z.infer<typeof CommitSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
export type Job = z.infer<typeof JobSchema>;
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

// Form schemas (for validation)
export const CreateContextoSchema = ContextoSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateContextoSchema = CreateContextoSchema.partial();

export type CreateContexto = z.infer<typeof CreateContextoSchema>;
export type UpdateContexto = z.infer<typeof UpdateContextoSchema>;