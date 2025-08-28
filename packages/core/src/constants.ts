// Application constants

export const APP_CONFIG = {
  name: 'Kontexto IA',
  version: '1.0.0',
  description: 'Sistema inteligente de análisis y documentación de código',
} as const;

export const API_ROUTES = {
  auth: {
    signin: '/api/auth/signin',
    signout: '/api/auth/signout',
    session: '/api/auth/session',
  },
  contextos: {
    list: '/api/contextos',
    create: '/api/contextos',
    get: (id: string) => `/api/contextos/${id}`,
    update: (id: string) => `/api/contextos/${id}`,
    delete: (id: string) => `/api/contextos/${id}`,
    analyze: (id: string) => `/api/contextos/${id}/analyze`,
  },
  commits: {
    list: (contextoId: string) => `/api/contextos/${contextoId}/commits`,
    get: (contextoId: string, commitId: string) => `/api/contextos/${contextoId}/commits/${commitId}`,
  },
  webhooks: {
    github: '/api/webhooks/github',
    gitlab: '/api/webhooks/gitlab',
    bitbucket: '/api/webhooks/bitbucket',
  },
  jobs: {
    list: '/api/jobs',
    get: (id: string) => `/api/jobs/${id}`,
    status: (id: string) => `/api/jobs/${id}/status`,
  },
  search: {
    semantic: '/api/search/semantic',
    code: '/api/search/code',
  },
} as const;

export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
  defaultPage: 1,
} as const;

export const JOB_TYPES = {
  ANALYZE_COMMIT: 'analyze_commit',
  ANALYZE_REPO: 'analyze_repo',
  GENERATE_DOCS: 'generate_docs',
} as const;

export const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const ANALYSIS_IMPACT = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const ANALYSIS_COMPLEXITY = {
  SIMPLE: 'simple',
  MODERATE: 'moderate',
  COMPLEX: 'complex',
} as const;

export const SUPPORTED_LANGUAGES = [
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
] as const;

export const FILE_EXTENSIONS = {
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
} as const;

export const WEBHOOK_EVENTS = {
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
} as const;

export const ERROR_MESSAGES = {
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
} as const;

export const SUCCESS_MESSAGES = {
  CONTEXTO_CREATED: 'Contexto creado exitosamente',
  CONTEXTO_UPDATED: 'Contexto actualizado exitosamente',
  CONTEXTO_DELETED: 'Contexto eliminado exitosamente',
  ANALYSIS_STARTED: 'Análisis iniciado',
  ANALYSIS_COMPLETED: 'Análisis completado',
  WEBHOOK_PROCESSED: 'Webhook procesado exitosamente',
} as const;

export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

export const LIMITS = {
  MAX_REPO_SIZE: 500 * 1024 * 1024, // 500MB
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_CONCURRENT_JOBS: 5,
  MAX_RETRIES: 3,
  WEBHOOK_TIMEOUT: 30000, // 30 seconds
  GIT_TIMEOUT: 300000, // 5 minutes
} as const;