// Application constants

export const JOB_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing', 
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const JOB_TYPES = {
  ANALYZE_COMMIT: 'analyze_commit',
  ANALYZE_REPO: 'analyze_repo',
  GENERATE_DOCS: 'generate_docs',
} as const;

export const GITHUB_CONFIG = {
  MAX_REPOS_PER_PAGE: 100,
  DEFAULT_REPOS_PER_PAGE: 20,
  MAX_BRANCHES_TO_FETCH: 100,
  RATE_LIMIT_DELAY: 1000, // ms
} as const;

export const ANALYSIS_CONFIG = {
  DEFAULT_TIMEOUT_MINUTES: 30,
  MAX_ATTEMPTS: 3,
  POLLING_INTERVAL: 5000, // ms
  AUTO_REFRESH_INTERVAL: 10000, // ms
} as const;

export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300, // ms
  TOAST_DURATION: 5000, // ms
  MODAL_ANIMATION_DURATION: 200, // ms
} as const;

export const API_CONFIG = {
  DEFAULT_TIMEOUT: 10000, // ms
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // ms
} as const;

export const VALIDATION_RULES = {
  CONTEXT_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  CONTEXT_DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 500,
  },
  TAGS: {
    MAX_COUNT: 10,
    MAX_LENGTH: 30,
  },
  REPO_URL: {
    PATTERN: /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+$/,
  },
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  VALIDATION_ERROR: 'Los datos proporcionados no son válidos.',
  SERVER_ERROR: 'Error interno del servidor. Intenta nuevamente.',
  TIMEOUT_ERROR: 'La solicitud tardó demasiado tiempo. Intenta nuevamente.',
  UNKNOWN_ERROR: 'Ocurrió un error inesperado.',
} as const;

export const SUCCESS_MESSAGES = {
  CONTEXT_CREATED: 'Contexto creado exitosamente',
  CONTEXT_UPDATED: 'Contexto actualizado exitosamente',
  CONTEXT_DELETED: 'Contexto eliminado exitosamente',
  ANALYSIS_STARTED: 'Análisis iniciado exitosamente',
  ANALYSIS_CANCELLED: 'Análisis cancelado exitosamente',
} as const;

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  CONTEXTS: '/contextos',
  CONTEXT_DETAIL: (id: string) => `/contextos/${id}`,
  ANALYSIS_STATUS: '/analysis/status',
  AUTH_SIGNIN: '/auth/signin',
} as const;

export const LOCAL_STORAGE_KEYS = {
  THEME: 'kontexto-theme',
  SIDEBAR_COLLAPSED: 'kontexto-sidebar-collapsed',
  RECENT_SEARCHES: 'kontexto-recent-searches',
} as const;