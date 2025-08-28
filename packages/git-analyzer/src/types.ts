export interface GitCommitInfo {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  date: Date;
  files: string[];
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface GitDiffFile {
  fileName: string;
  oldPath?: string;
  newPath?: string;
  isNew: boolean;
  isDeleted: boolean;
  isRenamed: boolean;
  additions: string[];
  deletions: string[];
  chunks: DiffChunk[];
}

export interface DiffChunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'add' | 'delete' | 'context';
  content: string;
  oldNumber?: number;
  newNumber?: number;
}

export interface ParsedCode {
  language: string;
  functions: FunctionInfo[];
  classes: ClassInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  comments: CommentInfo[];
  complexity: number;
  linesOfCode: number;
}

export interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  parameters: string[];
  returnType?: string;
  complexity: number;
  docstring?: string;
}

export interface ClassInfo {
  name: string;
  startLine: number;
  endLine: number;
  methods: FunctionInfo[];
  properties: PropertyInfo[];
  superclass?: string;
  interfaces?: string[];
}

export interface PropertyInfo {
  name: string;
  type?: string;
  isPrivate: boolean;
  isStatic: boolean;
}

export interface ImportInfo {
  module: string;
  items: string[];
  isDefault: boolean;
  alias?: string;
}

export interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'variable' | 'default';
  isDefault: boolean;
}

export interface CommentInfo {
  type: 'line' | 'block' | 'docstring';
  content: string;
  line: number;
  endLine?: number;
}

export interface RepositoryMetrics {
  totalFiles: number;
  totalLinesOfCode: number;
  languageBreakdown: Record<string, number>;
  complexityScore: number;
  testCoverage?: number;
  dependencies: DependencyInfo[];
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'direct' | 'dev' | 'peer';
  source: string; // package.json, requirements.txt, etc.
}

export interface AnalysisResult {
  commit: GitCommitInfo;
  changedFiles: ParsedCode[];
  diffAnalysis: DiffAnalysis;
  impactAssessment: ImpactAssessment;
  suggestions: string[];
}

export interface DiffAnalysis {
  addedFunctions: FunctionInfo[];
  removedFunctions: FunctionInfo[];
  modifiedFunctions: FunctionInfo[];
  addedClasses: ClassInfo[];
  removedClasses: ClassInfo[];
  modifiedClasses: ClassInfo[];
  complexityChange: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ImpactAssessment {
  affectedModules: string[];
  breakingChanges: BreakingChange[];
  testImpact: TestImpact;
  performanceImpact: 'positive' | 'negative' | 'neutral';
  securityImpact: SecurityImpact;
}

export interface BreakingChange {
  type: 'api' | 'signature' | 'behavior' | 'removal';
  description: string;
  file: string;
  line: number;
  severity: 'low' | 'medium' | 'high';
}

export interface TestImpact {
  testsAffected: string[];
  newTestsNeeded: string[];
  coverageChange: number;
}

export interface SecurityImpact {
  vulnerabilities: SecurityVulnerability[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SecurityVulnerability {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  line: number;
  recommendation: string;
}

export interface CloneOptions {
  branch?: string;
  depth?: number;
  single?: boolean;
  timeout?: number;
}

export interface LanguageConfig {
  extensions: string[];
  parser: string;
  commentPatterns: {
    line: string[];
    block: Array<{ start: string; end: string }>;
  };
}

export interface CodeMetrics {
  complexity: number;
  linesOfCode: number;
  maintainabilityIndex: number;
  technicalDebt: number;
}