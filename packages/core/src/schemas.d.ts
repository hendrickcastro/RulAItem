import { z } from 'zod';
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    avatar: z.ZodOptional<z.ZodString>;
    githubId: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    name: string;
    githubId: string;
    createdAt: Date;
    updatedAt: Date;
    avatar?: string | undefined;
}, {
    id: string;
    email: string;
    name: string;
    githubId: string;
    createdAt: Date;
    updatedAt: Date;
    avatar?: string | undefined;
}>;
export declare const ContextoSchema: z.ZodObject<{
    id: z.ZodString;
    nombre: z.ZodString;
    descripcion: z.ZodString;
    repoUrl: z.ZodString;
    responsableId: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    nombre: string;
    descripcion: string;
    repoUrl: string;
    responsableId: string;
    tags: string[];
    isActive: boolean;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    nombre: string;
    descripcion: string;
    repoUrl: string;
    responsableId: string;
    tags?: string[] | undefined;
    isActive?: boolean | undefined;
}>;
export declare const CommitSchema: z.ZodObject<{
    id: z.ZodString;
    contextoId: z.ZodString;
    sha: z.ZodString;
    message: z.ZodString;
    author: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        name: string;
    }, {
        email: string;
        name: string;
    }>;
    date: z.ZodDate;
    filesChanged: z.ZodArray<z.ZodString, "many">;
    additions: z.ZodNumber;
    deletions: z.ZodNumber;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    message: string;
    contextoId: string;
    sha: string;
    author: {
        email: string;
        name: string;
    };
    date: Date;
    filesChanged: string[];
    additions: number;
    deletions: number;
}, {
    id: string;
    createdAt: Date;
    message: string;
    contextoId: string;
    sha: string;
    author: {
        email: string;
        name: string;
    };
    date: Date;
    filesChanged: string[];
    additions: number;
    deletions: number;
}>;
export declare const AnalysisSchema: z.ZodObject<{
    id: z.ZodString;
    commitId: z.ZodString;
    summary: z.ZodString;
    impact: z.ZodEnum<["low", "medium", "high"]>;
    complexity: z.ZodEnum<["simple", "moderate", "complex"]>;
    patterns: z.ZodArray<z.ZodString, "many">;
    suggestions: z.ZodArray<z.ZodString, "many">;
    codeQuality: z.ZodNumber;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    commitId: string;
    summary: string;
    impact: "low" | "medium" | "high";
    complexity: "simple" | "moderate" | "complex";
    patterns: string[];
    suggestions: string[];
    codeQuality: number;
}, {
    id: string;
    createdAt: Date;
    commitId: string;
    summary: string;
    impact: "low" | "medium" | "high";
    complexity: "simple" | "moderate" | "complex";
    patterns: string[];
    suggestions: string[];
    codeQuality: number;
}>;
export declare const JobSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["analyze_commit", "analyze_repo", "generate_docs"]>;
    status: z.ZodEnum<["pending", "processing", "completed", "failed"]>;
    payload: z.ZodRecord<z.ZodString, z.ZodAny>;
    result: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    error: z.ZodOptional<z.ZodString>;
    attempts: z.ZodDefault<z.ZodNumber>;
    maxAttempts: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    completedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    type: "analyze_commit" | "analyze_repo" | "generate_docs";
    status: "pending" | "processing" | "completed" | "failed";
    payload: Record<string, any>;
    attempts: number;
    maxAttempts: number;
    result?: Record<string, any> | undefined;
    error?: string | undefined;
    completedAt?: Date | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    type: "analyze_commit" | "analyze_repo" | "generate_docs";
    status: "pending" | "processing" | "completed" | "failed";
    payload: Record<string, any>;
    result?: Record<string, any> | undefined;
    error?: string | undefined;
    attempts?: number | undefined;
    maxAttempts?: number | undefined;
    completedAt?: Date | undefined;
}>;
export declare const WebhookEventSchema: z.ZodObject<{
    id: z.ZodString;
    source: z.ZodEnum<["github", "gitlab", "bitbucket"]>;
    event: z.ZodString;
    payload: z.ZodRecord<z.ZodString, z.ZodAny>;
    processed: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    payload: Record<string, any>;
    source: "github" | "gitlab" | "bitbucket";
    event: string;
    processed: boolean;
}, {
    id: string;
    createdAt: Date;
    payload: Record<string, any>;
    source: "github" | "gitlab" | "bitbucket";
    event: string;
    processed?: boolean | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
export type Contexto = z.infer<typeof ContextoSchema>;
export type Commit = z.infer<typeof CommitSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
export type Job = z.infer<typeof JobSchema>;
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
export declare const CreateContextoSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    nombre: z.ZodString;
    descripcion: z.ZodString;
    repoUrl: z.ZodString;
    responsableId: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "id" | "createdAt" | "updatedAt">, "strip", z.ZodTypeAny, {
    nombre: string;
    descripcion: string;
    repoUrl: string;
    responsableId: string;
    tags: string[];
    isActive: boolean;
}, {
    nombre: string;
    descripcion: string;
    repoUrl: string;
    responsableId: string;
    tags?: string[] | undefined;
    isActive?: boolean | undefined;
}>;
export declare const UpdateContextoSchema: z.ZodObject<{
    nombre: z.ZodOptional<z.ZodString>;
    descripcion: z.ZodOptional<z.ZodString>;
    repoUrl: z.ZodOptional<z.ZodString>;
    responsableId: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    nombre?: string | undefined;
    descripcion?: string | undefined;
    repoUrl?: string | undefined;
    responsableId?: string | undefined;
    tags?: string[] | undefined;
    isActive?: boolean | undefined;
}, {
    nombre?: string | undefined;
    descripcion?: string | undefined;
    repoUrl?: string | undefined;
    responsableId?: string | undefined;
    tags?: string[] | undefined;
    isActive?: boolean | undefined;
}>;
export type CreateContexto = z.infer<typeof CreateContextoSchema>;
export type UpdateContexto = z.infer<typeof UpdateContextoSchema>;
//# sourceMappingURL=schemas.d.ts.map