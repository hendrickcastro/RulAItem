import { apiClient, ApiResponse } from '@/lib/api/client';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  private: boolean;
  fork: boolean;
  topics: string[];
}

export interface RepositoriesResponse {
  repositories: GitHubRepository[];
  total?: number;
}

export interface BranchesResponse {
  branches: string[];
}

export interface RepositoryParams {
  page?: number;
  per_page?: number;
  sort?: 'updated' | 'created' | 'pushed' | 'full_name';
  type?: 'all' | 'owner' | 'member';
  search?: string;
}

class GitHubService {
  async getRepositories(params: RepositoryParams = {}): Promise<ApiResponse<RepositoriesResponse>> {
    const searchParams = new URLSearchParams({
      page: '1',
      per_page: '20',
      sort: 'updated',
      type: 'owner',
      ...Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ),
    });

    return apiClient.get<RepositoriesResponse>(`/github/repositories?${searchParams}`);
  }

  async getBranches(owner: string, repo: string): Promise<ApiResponse<BranchesResponse>> {
    return apiClient.get<BranchesResponse>(`/github/repositories/branches?owner=${owner}&repo=${repo}`);
  }

  async getBranchesFromUrl(repoUrl: string): Promise<ApiResponse<BranchesResponse>> {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    if (!owner || !repo) {
      return { error: 'Invalid repository URL format' };
    }
    return this.getBranches(owner, repo);
  }

  // Helper methods
  parseRepoUrl(repoUrl: string): { owner?: string; repo?: string } {
    try {
      const url = new URL(repoUrl);
      const [, owner, repo] = url.pathname.split('/');
      return { owner, repo: repo?.replace('.git', '') };
    } catch {
      // Fallback for non-URL format
      const parts = repoUrl.replace('https://github.com/', '').split('/');
      return { owner: parts[0], repo: parts[1]?.replace('.git', '') };
    }
  }

  isGitHubUrl(url: string): boolean {
    return url.includes('github.com');
  }

  formatRepoUrl(repoUrl: string): string {
    if (!repoUrl.startsWith('http')) {
      return `https://github.com/${repoUrl}`;
    }
    return repoUrl;
  }

  getRepoDisplayName(repoUrl: string): string {
    return repoUrl.replace('https://github.com/', '');
  }

  isRepoAlreadyAdded(repositories: GitHubRepository[], contexts: any[]): GitHubRepository[] {
    const contextUrls = new Set(contexts.map(ctx => ctx.repoUrl));
    return repositories.map(repo => ({
      ...repo,
      isAlreadyAdded: contextUrls.has(repo.html_url),
    })) as GitHubRepository[];
  }

  getDefaultBranch(branches: string[]): string {
    // Priority: master > main > first available
    if (branches.includes('master')) return 'master';
    if (branches.includes('main')) return 'main';
    return branches[0] || 'main';
  }
}

export const githubService = new GitHubService();