import { useState, useCallback, useEffect } from 'react';
import { analysisService, AnalysisJob } from '@/lib/services';

interface UseAnalysisReturn {
  jobs: AnalysisJob[];
  isLoading: boolean;
  error: string | null;
  // Actions
  fetchJobs: () => Promise<void>;
  startAnalysis: (contextId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  cancelJob: (jobId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  cancelContextJobs: (contextId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  // Helpers
  getRunningJobs: () => AnalysisJob[];
  getJobsByStatus: (status: AnalysisJob['status']) => AnalysisJob[];
  getJobForContext: (contextId: string) => AnalysisJob | undefined;
  getJobStats: () => { pending: number; processing: number; completed: number; failed: number; total: number };
  clearError: () => void;
}

export function useAnalysis(autoRefresh = true, refreshInterval = 10000): UseAnalysisReturn {
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await analysisService.getAnalysisJobs();
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setJobs(response.data.jobs || []);
      }
    } catch (err) {
      setError('Error de conexión al cargar trabajos de análisis');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startAnalysis = useCallback(async (contextId: string) => {
    try {
      setError(null);
      const response = await analysisService.startAnalysis(contextId);
      
      if (response.error) {
        setError(response.error);
        return { success: false, error: response.error };
      }
      
      if (response.data) {
        // Refresh jobs to show the new job
        await fetchJobs();
        return { success: true, message: response.data.message };
      }
      
      return { success: false, error: 'No se recibieron datos' };
    } catch (err) {
      const error = 'Error de conexión al iniciar análisis';
      setError(error);
      return { success: false, error };
    }
  }, [fetchJobs]);

  const cancelJob = useCallback(async (jobId: string) => {
    try {
      setError(null);
      const response = await analysisService.cancelJob(jobId);
      
      if (response.error) {
        setError(response.error);
        return { success: false, error: response.error };
      }
      
      if (response.data) {
        // Refresh jobs to show updated status
        await fetchJobs();
        return { success: true, message: response.data.message };
      }
      
      return { success: false, error: 'No se recibieron datos' };
    } catch (err) {
      const error = 'Error de conexión al cancelar trabajo';
      setError(error);
      return { success: false, error };
    }
  }, [fetchJobs]);

  const cancelContextJobs = useCallback(async (contextId: string) => {
    try {
      setError(null);
      const response = await analysisService.cancelContextJobs(contextId);
      
      if (response.error) {
        setError(response.error);
        return { success: false, error: response.error };
      }
      
      if (response.data) {
        // Refresh jobs to show updated status
        await fetchJobs();
        return { success: true, message: response.data.message };
      }
      
      return { success: false, error: 'No se recibieron datos' };
    } catch (err) {
      const error = 'Error de conexión al cancelar trabajos';
      setError(error);
      return { success: false, error };
    }
  }, [fetchJobs]);

  // Helper functions
  const getRunningJobs = useCallback(() => {
    return analysisService.getRunningJobs(jobs);
  }, [jobs]);

  const getJobsByStatus = useCallback((status: AnalysisJob['status']) => {
    return analysisService.getJobsByStatus(jobs, status);
  }, [jobs]);

  const getJobForContext = useCallback((contextId: string) => {
    return analysisService.getJobForContext(jobs, contextId);
  }, [jobs]);

  const getJobStats = useCallback(() => {
    return {
      pending: getJobsByStatus('pending').length,
      processing: getJobsByStatus('processing').length,
      completed: getJobsByStatus('completed').length,
      failed: getJobsByStatus('failed').length,
      total: jobs.length,
    };
  }, [jobs, getJobsByStatus]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && getRunningJobs().length > 0) {
      const interval = setInterval(fetchJobs, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchJobs, getRunningJobs]);

  return {
    jobs,
    isLoading,
    error,
    fetchJobs,
    startAnalysis,
    cancelJob,
    cancelContextJobs,
    getRunningJobs,
    getJobsByStatus,
    getJobForContext,
    getJobStats,
    clearError,
  };
}