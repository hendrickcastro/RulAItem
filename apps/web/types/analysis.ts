import { BaseEntity, JobStatus } from './common';

export interface AnalysisJob extends BaseEntity {
  type: string;
  status: JobStatus;
  contextId: string;
  contextName: string;
  repoUrl?: string;
  payload: {
    contextId: string;
    userId: string;
    repoUrl: string;
    branch: string;
    contextName: string;
    accessToken?: string;
  };
  result?: any;
  error?: string;
  attempts: number;
  maxAttempts: number;
  completedAt?: string;
}

export interface AnalysisStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

export interface StuckJob {
  id: string;
  type: string;
  status: string;
  contextId: string;
  contextName: string;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  stuckDurationMinutes: number;
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'error';
  stuckJobsCount: number;
  timeoutMinutes: number;
  autoCancelledCount?: number;
}

export interface AnalysisHealth {
  health: HealthStatus;
  stats: AnalysisStats;
  stuckJobs: StuckJob[];
  recommendations: string[];
}