import { useState, useCallback } from 'react';
import { githubService, GitHubRepository, RepositoryParams } from '@/lib/services';

interface UseGitHubReturn {
  repositories: GitHubRepository[];
  branches: string[];
  isLoading: boolean;
  isLoadingBranches: boolean;
  error: string | null;
  // Actions
  fetchRepositories: (params?: RepositoryParams) => Promise<void>;
  fetchBranches: (repoUrl: string) => Promise<void>;
  searchRepositories: (query: string) => Promise<void>;
  // Helpers
  clearError: () => void;
  clearBranches: () => void;
}

export function useGitHub(): UseGitHubReturn {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRepositories = useCallback(async (params: RepositoryParams = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await githubService.getRepositories(params);
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setRepositories(response.data.repositories || []);
      }
    } catch (err) {
      setError('Error de conexión al cargar repositorios');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBranches = useCallback(async (repoUrl: string) => {
    if (!repoUrl.trim()) {
      setBranches([]);
      return;
    }

    try {
      setIsLoadingBranches(true);
      setError(null);
      const response = await githubService.getBranchesFromUrl(repoUrl);
      
      if (response.error) {
        setError(response.error);
        setBranches([]);
      } else if (response.data) {
        setBranches(response.data.branches || []);
      }
    } catch (err) {
      setError('Error de conexión al cargar ramas');
      setBranches([]);
    } finally {
      setIsLoadingBranches(false);
    }
  }, []);

  const searchRepositories = useCallback(async (query: string) => {
    if (!query.trim()) {
      await fetchRepositories();
      return;
    }

    await fetchRepositories({ search: query });
  }, [fetchRepositories]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearBranches = useCallback(() => {
    setBranches([]);
  }, []);

  return {
    repositories,
    branches,
    isLoading,
    isLoadingBranches,
    error,
    fetchRepositories,
    fetchBranches,
    searchRepositories,
    clearError,
    clearBranches,
  };
}