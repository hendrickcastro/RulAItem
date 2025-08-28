import { z } from 'zod';

export const RepoSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "El nombre es requerido"),
  owner: z.string().min(1, "El propietario es requerido"),
  url: z.string().url("Debe ser una URL válida"),
  branch: z.string().default('main'),
  userId: z.string(),
  githubId: z.number(),
  defaultBranch: z.string(),
  isPrivate: z.boolean().default(false),
  webhookId: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const CreateRepoSchema = RepoSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const UpdateRepoSchema = RepoSchema.partial().omit({
  id: true,
  userId: true,
  createdAt: true
});

export type Repo = z.infer<typeof RepoSchema>;
export type CreateRepoData = z.infer<typeof CreateRepoSchema>;
export type UpdateRepoData = z.infer<typeof UpdateRepoSchema>;
