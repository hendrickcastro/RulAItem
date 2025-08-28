// Additional TypeScript types that don't need runtime validation

export interface GitRepository {
  url: string;
  branch: string;
  lastCommit?: string;
  isPrivate: boolean;
  size: number;
}

export interface CodeMetrics {
  linesOfCode: number;
  filesCount: number;
  complexity: number;
  testCoverage?: number;
  dependencies: string[];
}

export interface AnalysisResult {
  summary: string;
  keyChanges: string[];
  impactedAreas: string[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  codeSmells: string[];
}

export interface GitDiff {
  fileName: string;
  additions: string[];
  deletions: string[];
  oldPath?: string;
  newPath?: string;
  isNew: boolean;
  isDeleted: boolean;
  isRenamed: boolean;
}

export interface TreeSitterNode {
  type: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  text: string;
  children: TreeSitterNode[];
}

export interface LLMAnalysisRequest {
  code: string;
  diff?: GitDiff[];
  context: string;
  language: string;
  analysisType: 'commit' | 'function' | 'class' | 'file' | 'full';
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
  content: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Worker message types
export interface WorkerMessage {
  id: string;
  type: 'job' | 'status' | 'result' | 'error';
  payload: any;
  timestamp: Date;
}

export interface JobProgress {
  jobId: string;
  step: string;
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number;
}