import { z } from 'zod';
export declare const AnalysisSchema: z.ZodObject<{
    id: z.ZodString;
    repoId: z.ZodString;
    commitSha: z.ZodString;
    branch: z.ZodString;
    status: z.ZodEnum<["pending", "processing", "completed", "failed"]>;
    author: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        username: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email: string;
        username?: string | undefined;
    }, {
        name: string;
        email: string;
        username?: string | undefined;
    }>;
    message: z.ZodString;
    documentation: z.ZodOptional<z.ZodString>;
    metrics: z.ZodOptional<z.ZodObject<{
        linesAdded: z.ZodNumber;
        linesRemoved: z.ZodNumber;
        filesModified: z.ZodNumber;
        complexity: z.ZodOptional<z.ZodNumber>;
        testCoverage: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        linesAdded: number;
        linesRemoved: number;
        filesModified: number;
        complexity?: number | undefined;
        testCoverage?: number | undefined;
    }, {
        linesAdded: number;
        linesRemoved: number;
        filesModified: number;
        complexity?: number | undefined;
        testCoverage?: number | undefined;
    }>>;
    processingTime: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
    queuedAt: z.ZodDate;
    startedAt: z.ZodOptional<z.ZodDate>;
    completedAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    branch: string;
    createdAt: Date;
    updatedAt: Date;
    message: string;
    status: "pending" | "processing" | "completed" | "failed";
    repoId: string;
    commitSha: string;
    author: {
        name: string;
        email: string;
        username?: string | undefined;
    };
    queuedAt: Date;
    documentation?: string | undefined;
    metrics?: {
        linesAdded: number;
        linesRemoved: number;
        filesModified: number;
        complexity?: number | undefined;
        testCoverage?: number | undefined;
    } | undefined;
    processingTime?: number | undefined;
    error?: string | undefined;
    startedAt?: Date | undefined;
    completedAt?: Date | undefined;
}, {
    id: string;
    branch: string;
    createdAt: Date;
    updatedAt: Date;
    message: string;
    status: "pending" | "processing" | "completed" | "failed";
    repoId: string;
    commitSha: string;
    author: {
        name: string;
        email: string;
        username?: string | undefined;
    };
    queuedAt: Date;
    documentation?: string | undefined;
    metrics?: {
        linesAdded: number;
        linesRemoved: number;
        filesModified: number;
        complexity?: number | undefined;
        testCoverage?: number | undefined;
    } | undefined;
    processingTime?: number | undefined;
    error?: string | undefined;
    startedAt?: Date | undefined;
    completedAt?: Date | undefined;
}>;
export declare const CreateAnalysisSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    repoId: z.ZodString;
    commitSha: z.ZodString;
    branch: z.ZodString;
    status: z.ZodEnum<["pending", "processing", "completed", "failed"]>;
    author: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        username: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email: string;
        username?: string | undefined;
    }, {
        name: string;
        email: string;
        username?: string | undefined;
    }>;
    message: z.ZodString;
    documentation: z.ZodOptional<z.ZodString>;
    metrics: z.ZodOptional<z.ZodObject<{
        linesAdded: z.ZodNumber;
        linesRemoved: z.ZodNumber;
        filesModified: z.ZodNumber;
        complexity: z.ZodOptional<z.ZodNumber>;
        testCoverage: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        linesAdded: number;
        linesRemoved: number;
        filesModified: number;
        complexity?: number | undefined;
        testCoverage?: number | undefined;
    }, {
        linesAdded: number;
        linesRemoved: number;
        filesModified: number;
        complexity?: number | undefined;
        testCoverage?: number | undefined;
    }>>;
    processingTime: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
    queuedAt: z.ZodDate;
    startedAt: z.ZodOptional<z.ZodDate>;
    completedAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "id" | "createdAt" | "updatedAt">, "strip", z.ZodTypeAny, {
    branch: string;
    message: string;
    status: "pending" | "processing" | "completed" | "failed";
    repoId: string;
    commitSha: string;
    author: {
        name: string;
        email: string;
        username?: string | undefined;
    };
    queuedAt: Date;
    documentation?: string | undefined;
    metrics?: {
        linesAdded: number;
        linesRemoved: number;
        filesModified: number;
        complexity?: number | undefined;
        testCoverage?: number | undefined;
    } | undefined;
    processingTime?: number | undefined;
    error?: string | undefined;
    startedAt?: Date | undefined;
    completedAt?: Date | undefined;
}, {
    branch: string;
    message: string;
    status: "pending" | "processing" | "completed" | "failed";
    repoId: string;
    commitSha: string;
    author: {
        name: string;
        email: string;
        username?: string | undefined;
    };
    queuedAt: Date;
    documentation?: string | undefined;
    metrics?: {
        linesAdded: number;
        linesRemoved: number;
        filesModified: number;
        complexity?: number | undefined;
        testCoverage?: number | undefined;
    } | undefined;
    processingTime?: number | undefined;
    error?: string | undefined;
    startedAt?: Date | undefined;
    completedAt?: Date | undefined;
}>;
export declare const AnalysisJobSchema: z.ZodObject<{
    analysisId: z.ZodString;
    repoId: z.ZodString;
    commitSha: z.ZodString;
    repoUrl: z.ZodString;
    branch: z.ZodString;
    author: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        username: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email: string;
        username?: string | undefined;
    }, {
        name: string;
        email: string;
        username?: string | undefined;
    }>;
    message: z.ZodString;
    timestamp: z.ZodString;
    priority: z.ZodDefault<z.ZodEnum<["low", "normal", "high"]>>;
}, "strip", z.ZodTypeAny, {
    branch: string;
    message: string;
    repoId: string;
    commitSha: string;
    author: {
        name: string;
        email: string;
        username?: string | undefined;
    };
    analysisId: string;
    repoUrl: string;
    timestamp: string;
    priority: "low" | "normal" | "high";
}, {
    branch: string;
    message: string;
    repoId: string;
    commitSha: string;
    author: {
        name: string;
        email: string;
        username?: string | undefined;
    };
    analysisId: string;
    repoUrl: string;
    timestamp: string;
    priority?: "low" | "normal" | "high" | undefined;
}>;
export type Analysis = z.infer<typeof AnalysisSchema>;
export type CreateAnalysisData = z.infer<typeof CreateAnalysisSchema>;
export type AnalysisJobData = z.infer<typeof AnalysisJobSchema>;
//# sourceMappingURL=analysis.d.ts.map