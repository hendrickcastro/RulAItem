"use strict";
// Application constants
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIMITS = exports.CACHE_TTL = exports.SUCCESS_MESSAGES = exports.ERROR_MESSAGES = exports.WEBHOOK_EVENTS = exports.FILE_EXTENSIONS = exports.SUPPORTED_LANGUAGES = exports.ANALYSIS_COMPLEXITY = exports.ANALYSIS_IMPACT = exports.JOB_STATUS = exports.JOB_TYPES = exports.PAGINATION = exports.API_ROUTES = exports.APP_CONFIG = void 0;
exports.APP_CONFIG = {
    name: 'Kontexto IA',
    version: '1.0.0',
    description: 'Sistema inteligente de análisis y documentación de código',
};
exports.API_ROUTES = {
    auth: {
        signin: '/api/auth/signin',
        signout: '/api/auth/signout',
        session: '/api/auth/session',
    },
    contextos: {
        list: '/api/contextos',
        create: '/api/contextos',
        get: (id) => `/api/contextos/${id}`,
        update: (id) => `/api/contextos/${id}`,
        delete: (id) => `/api/contextos/${id}`,
        analyze: (id) => `/api/contextos/${id}/analyze`,
    },
    commits: {
        list: (contextoId) => `/api/contextos/${contextoId}/commits`,
        get: (contextoId, commitId) => `/api/contextos/${contextoId}/commits/${commitId}`,
    },
    webhooks: {
        github: '/api/webhooks/github',
        gitlab: '/api/webhooks/gitlab',
        bitbucket: '/api/webhooks/bitbucket',
    },
    jobs: {
        list: '/api/jobs',
        get: (id) => `/api/jobs/${id}`,
        status: (id) => `/api/jobs/${id}/status`,
    },
    search: {
        semantic: '/api/search/semantic',
        code: '/api/search/code',
    },
};
exports.PAGINATION = {
    defaultLimit: 20,
    maxLimit: 100,
    defaultPage: 1,
};
exports.JOB_TYPES = {
    ANALYZE_COMMIT: 'analyze_commit',
    ANALYZE_REPO: 'analyze_repo',
    GENERATE_DOCS: 'generate_docs',
};
exports.JOB_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
};
exports.ANALYSIS_IMPACT = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
};
exports.ANALYSIS_COMPLEXITY = {
    SIMPLE: 'simple',
    MODERATE: 'moderate',
    COMPLEX: 'complex',
};
exports.SUPPORTED_LANGUAGES = [
    'javascript',
    'typescript',
    'python',
    'java',
    'go',
    'rust',
    'php',
    'ruby',
    'c',
    'cpp',
    'csharp',
    'swift',
    'kotlin',
    'scala',
    'clojure',
];
exports.FILE_EXTENSIONS = {
    javascript: ['.js', '.jsx', '.mjs', '.cjs'],
    typescript: ['.ts', '.tsx', '.d.ts'],
    python: ['.py', '.pyx', '.pyw'],
    java: ['.java'],
    go: ['.go'],
    rust: ['.rs'],
    php: ['.php'],
    ruby: ['.rb'],
    c: ['.c', '.h'],
    cpp: ['.cpp', '.cc', '.cxx', '.hpp', '.hh', '.hxx'],
    csharp: ['.cs'],
    swift: ['.swift'],
    kotlin: ['.kt', '.kts'],
    scala: ['.scala'],
    clojure: ['.clj', '.cljs', '.cljc'],
};
exports.WEBHOOK_EVENTS = {
    GITHUB: {
        PUSH: 'push',
        PULL_REQUEST: 'pull_request',
        ISSUES: 'issues',
        RELEASE: 'release',
    },
    GITLAB: {
        PUSH: 'Push Hook',
        MERGE_REQUEST: 'Merge Request Hook',
        ISSUES: 'Issue Hook',
        TAG: 'Tag Push Hook',
    },
    BITBUCKET: {
        PUSH: 'repo:push',
        PULL_REQUEST: 'pullrequest:created',
    },
};
exports.ERROR_MESSAGES = {
    INVALID_INPUT: 'Datos de entrada inválidos',
    UNAUTHORIZED: 'No autorizado',
    FORBIDDEN: 'Acceso denegado',
    NOT_FOUND: 'Recurso no encontrado',
    INTERNAL_ERROR: 'Error interno del servidor',
    RATE_LIMITED: 'Límite de peticiones excedido',
    REPO_NOT_FOUND: 'Repositorio no encontrado',
    REPO_PRIVATE: 'Repositorio privado, se requiere autenticación',
    GIT_CLONE_FAILED: 'Error al clonar el repositorio',
    ANALYSIS_FAILED: 'Error en el análisis del código',
    LLM_API_ERROR: 'Error en la API de IA',
    DATABASE_ERROR: 'Error de base de datos',
};
exports.SUCCESS_MESSAGES = {
    CONTEXTO_CREATED: 'Contexto creado exitosamente',
    CONTEXTO_UPDATED: 'Contexto actualizado exitosamente',
    CONTEXTO_DELETED: 'Contexto eliminado exitosamente',
    ANALYSIS_STARTED: 'Análisis iniciado',
    ANALYSIS_COMPLETED: 'Análisis completado',
    WEBHOOK_PROCESSED: 'Webhook procesado exitosamente',
};
exports.CACHE_TTL = {
    SHORT: 300, // 5 minutes
    MEDIUM: 1800, // 30 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
};
exports.LIMITS = {
    MAX_REPO_SIZE: 500 * 1024 * 1024, // 500MB
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_CONCURRENT_JOBS: 5,
    MAX_RETRIES: 3,
    WEBHOOK_TIMEOUT: 30000, // 30 seconds
    GIT_TIMEOUT: 300000, // 5 minutes
};
//# sourceMappingURL=constants.js.map