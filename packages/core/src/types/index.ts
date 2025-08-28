export interface GitHubPushPayload {
  ref: string;
  before: string;
  after: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      name: string;
      email: string;
      login: string;
    };
    private: boolean;
    html_url: string;
    clone_url: string;
    default_branch: string;
  };
  commits: Array<{
    id: string;
    tree_id: string;
    distinct: boolean;
    message: string;
    timestamp: string;
    url: string;
    author: {
      name: string;
      email: string;
      username?: string;
    };
    committer: {
      name: string;
      email: string;
      username?: string;
    };
    added: string[];
    removed: string[];
    modified: string[];
  }>;
  head_commit: {
    id: string;
    tree_id: string;
    message: string;
    timestamp: string;
    author: {
      name: string;
      email: string;
      username?: string;
    };
    committer: {
      name: string;
      email: string;
      username?: string;
    };
  };
}

export interface CommitDiff {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  timestamp: string;
  modifiedFiles: Array<{
    path: string;
    status: 'added' | 'modified' | 'deleted';
    additions: number;
    deletions: number;
    patch?: string;
  }>;
  stats: {
    total: number;
    additions: number;
    deletions: number;
  };
}

export interface ParsedFile {
  path: string;
  language: string;
  content: string;
  ast?: any;
  functions?: Array<{
    name: string;
    line: number;
    params: string[];
    returnType?: string;
  }>;
  classes?: Array<{
    name: string;
    line: number;
    methods: string[];
  }>;
  imports?: string[];
  exports?: string[];
}
