export declare const APP_CONFIG: {
    readonly name: "Kontexto IA";
    readonly version: "1.0.0";
    readonly description: "Sistema inteligente de análisis y documentación de código";
};
export declare const API_ROUTES: {
    readonly auth: {
        readonly signin: "/api/auth/signin";
        readonly signout: "/api/auth/signout";
        readonly session: "/api/auth/session";
    };
    readonly contextos: {
        readonly list: "/api/contextos";
        readonly create: "/api/contextos";
        readonly get: (id: string) => string;
        readonly update: (id: string) => string;
        readonly delete: (id: string) => string;
        readonly analyze: (id: string) => string;
    };
    readonly commits: {
        readonly list: (contextoId: string) => string;
        readonly get: (contextoId: string, commitId: string) => string;
    };
    readonly webhooks: {
        readonly github: "/api/webhooks/github";
        readonly gitlab: "/api/webhooks/gitlab";
        readonly bitbucket: "/api/webhooks/bitbucket";
    };
    readonly jobs: {
        readonly list: "/api/jobs";
        readonly get: (id: string) => string;
        readonly status: (id: string) => string;
    };
    readonly search: {
        readonly semantic: "/api/search/semantic";
        readonly code: "/api/search/code";
    };
};
export declare const PAGINATION: {
    readonly defaultLimit: 20;
    readonly maxLimit: 100;
    readonly defaultPage: 1;
};
export declare const JOB_TYPES: {
    readonly ANALYZE_COMMIT: "analyze_commit";
    readonly ANALYZE_REPO: "analyze_repo";
    readonly GENERATE_DOCS: "generate_docs";
};
export declare const JOB_STATUS: {
    readonly PENDING: "pending";
    readonly PROCESSING: "processing";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
};
export declare const ANALYSIS_IMPACT: {
    readonly LOW: "low";
    readonly MEDIUM: "medium";
    readonly HIGH: "high";
};
export declare const ANALYSIS_COMPLEXITY: {
    readonly SIMPLE: "simple";
    readonly MODERATE: "moderate";
    readonly COMPLEX: "complex";
};
export declare const SUPPORTED_LANGUAGES: readonly ["javascript", "typescript", "python", "java", "go", "rust", "php", "ruby", "c", "cpp", "csharp", "swift", "kotlin", "scala", "clojure"];
export declare const FILE_EXTENSIONS: {
    readonly javascript: readonly [".js", ".jsx", ".mjs", ".cjs"];
    readonly typescript: readonly [".ts", ".tsx", ".d.ts"];
    readonly python: readonly [".py", ".pyx", ".pyw"];
    readonly java: readonly [".java"];
    readonly go: readonly [".go"];
    readonly rust: readonly [".rs"];
    readonly php: readonly [".php"];
    readonly ruby: readonly [".rb"];
    readonly c: readonly [".c", ".h"];
    readonly cpp: readonly [".cpp", ".cc", ".cxx", ".hpp", ".hh", ".hxx"];
    readonly csharp: readonly [".cs"];
    readonly swift: readonly [".swift"];
    readonly kotlin: readonly [".kt", ".kts"];
    readonly scala: readonly [".scala"];
    readonly clojure: readonly [".clj", ".cljs", ".cljc"];
};
export declare const WEBHOOK_EVENTS: {
    readonly GITHUB: {
        readonly PUSH: "push";
        readonly PULL_REQUEST: "pull_request";
        readonly ISSUES: "issues";
        readonly RELEASE: "release";
    };
    readonly GITLAB: {
        readonly PUSH: "Push Hook";
        readonly MERGE_REQUEST: "Merge Request Hook";
        readonly ISSUES: "Issue Hook";
        readonly TAG: "Tag Push Hook";
    };
    readonly BITBUCKET: {
        readonly PUSH: "repo:push";
        readonly PULL_REQUEST: "pullrequest:created";
    };
};
export declare const ERROR_MESSAGES: {
    readonly INVALID_INPUT: "Datos de entrada inválidos";
    readonly UNAUTHORIZED: "No autorizado";
    readonly FORBIDDEN: "Acceso denegado";
    readonly NOT_FOUND: "Recurso no encontrado";
    readonly INTERNAL_ERROR: "Error interno del servidor";
    readonly RATE_LIMITED: "Límite de peticiones excedido";
    readonly REPO_NOT_FOUND: "Repositorio no encontrado";
    readonly REPO_PRIVATE: "Repositorio privado, se requiere autenticación";
    readonly GIT_CLONE_FAILED: "Error al clonar el repositorio";
    readonly ANALYSIS_FAILED: "Error en el análisis del código";
    readonly LLM_API_ERROR: "Error en la API de IA";
    readonly DATABASE_ERROR: "Error de base de datos";
};
export declare const SUCCESS_MESSAGES: {
    readonly CONTEXTO_CREATED: "Contexto creado exitosamente";
    readonly CONTEXTO_UPDATED: "Contexto actualizado exitosamente";
    readonly CONTEXTO_DELETED: "Contexto eliminado exitosamente";
    readonly ANALYSIS_STARTED: "Análisis iniciado";
    readonly ANALYSIS_COMPLETED: "Análisis completado";
    readonly WEBHOOK_PROCESSED: "Webhook procesado exitosamente";
};
export declare const CACHE_TTL: {
    readonly SHORT: 300;
    readonly MEDIUM: 1800;
    readonly LONG: 3600;
    readonly VERY_LONG: 86400;
};
export declare const LIMITS: {
    readonly MAX_REPO_SIZE: number;
    readonly MAX_FILE_SIZE: number;
    readonly MAX_CONCURRENT_JOBS: 5;
    readonly MAX_RETRIES: 3;
    readonly WEBHOOK_TIMEOUT: 30000;
    readonly GIT_TIMEOUT: 300000;
};
//# sourceMappingURL=constants.d.ts.map