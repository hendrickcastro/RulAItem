export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  ssh_url?: string;
  git_url?: string;
  default_branch: string;
  language: string | null;
  languages_url?: string;
  stargazers_count: number;
  watchers_count?: number;
  forks_count: number;
  open_issues_count?: number;
  size?: number;
  updated_at: string;
  created_at?: string;
  pushed_at?: string;
  private: boolean;
  fork: boolean;
  archived?: boolean;
  disabled?: boolean;
  topics: string[];
  visibility?: 'public' | 'private';
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
  // Custom fields
  isAlreadyAdded?: boolean;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected?: boolean;
}

export interface GitHubUser {
  id: number;
  login: string;
  name?: string;
  email?: string;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Organization';
  public_repos?: number;
  public_gists?: number;
  followers?: number;
  following?: number;
  created_at?: string;
  updated_at?: string;
}

export interface RepositorySearchParams {
  page?: number;
  per_page?: number;
  sort?: 'updated' | 'created' | 'pushed' | 'full_name';
  direction?: 'asc' | 'desc';
  type?: 'all' | 'owner' | 'member';
  search?: string;
  language?: string;
  topic?: string;
}

export interface GitHubError {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
  }>;
}