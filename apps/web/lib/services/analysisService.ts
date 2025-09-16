import { apiClient, ApiResponse } from '@/lib/api/client';

export interface AnalysisJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  contextId: string;
  contextName: string;
  repoUrl?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  attempts?: number;
  error?: string;
}

export interface AnalysisJobsResponse {
  jobs: AnalysisJob[];
  total: number;
}

export interface StartAnalysisResponse {
  message: string;
  jobId: string;
  status: string;
  contextId: string;
  contextName: string;
  repoUrl: string;
  estimatedTime?: string;
  canNavigateAway?: boolean;
}

export interface CancelAnalysisResponse {
  message: string;
  cancelledCount: number;
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

export interface HealthResponse {
  health: {
    status: 'healthy' | 'warning' | 'error';
    stuckJobsCount: number;
    timeoutMinutes: number;
    autoCancelledCount: number;
  };
  stats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
  stuckJobs: StuckJob[];
  recommendations: string[];
}

class AnalysisService {
  async getAnalysisJobs(): Promise<ApiResponse<AnalysisJobsResponse>> {
    return apiClient.get<AnalysisJobsResponse>('/analysis/background');
  }

  async startAnalysis(contextId: string): Promise<ApiResponse<StartAnalysisResponse>> {
    return apiClient.post<StartAnalysisResponse>('/analysis/background', { contextId });
  }

  async cancelAnalysis(params: { contextId?: string; jobId?: string }): Promise<ApiResponse<CancelAnalysisResponse>> {
    return apiClient.post<CancelAnalysisResponse>('/analysis/cancel', params);
  }

  async cancelJob(jobId: string): Promise<ApiResponse<CancelAnalysisResponse>> {
    return this.cancelAnalysis({ jobId });
  }

  async cancelContextJobs(contextId: string): Promise<ApiResponse<CancelAnalysisResponse>> {
    return this.cancelAnalysis({ contextId });
  }

  async getHealth(timeoutMinutes = 30): Promise<ApiResponse<HealthResponse>> {
    return apiClient.get<HealthResponse>(`/analysis/health?timeout=${timeoutMinutes}`);
  }

  async autoFix(options?: {
    timeoutMinutes?: number;
    cancelStuckJobs?: boolean;
    retryFailedJobs?: boolean;
  }): Promise<ApiResponse<{ message: string; results: any; fixedCount: number }>> {
    return apiClient.post('/analysis/health', {
      timeoutMinutes: 30,
      cancelStuckJobs: true,
      retryFailedJobs: false,
      ...options,
    });
  }

  // Helper methods
  getJobsByStatus(jobs: AnalysisJob[], status: AnalysisJob['status']) {
    return jobs.filter(job => job.status === status);
  }

  getRunningJobs(jobs: AnalysisJob[]) {
    return jobs.filter(job => job.status === 'pending' || job.status === 'processing');
  }

  getJobForContext(jobs: AnalysisJob[], contextId: string) {
    return jobs.find(job => 
      job.contextId === contextId && 
      (job.status === 'pending' || job.status === 'processing')
    );
  }

  isJobRunning(job: AnalysisJob) {
    return job.status === 'pending' || job.status === 'processing';
  }

  canCancelJob(job: AnalysisJob) {
    return this.isJobRunning(job);
  }
}

export const analysisService = new AnalysisService();