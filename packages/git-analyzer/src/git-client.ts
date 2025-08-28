import { simpleGit, SimpleGit, LogResult, StatusResult } from 'simple-git';
import { promises as fs } from 'fs';
import { join } from 'path';
import { rimraf } from 'rimraf';
import { GitCommitInfo, CloneOptions } from './types';
import { extractRepoInfo, LIMITS } from '@kontexto/core';

export class GitClient {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  static async clone(
    repoUrl: string,
    targetPath: string,
    options: CloneOptions = {}
  ): Promise<GitClient> {
    const {
      branch = 'main',
      depth,
      single = false,
      timeout = LIMITS.GIT_TIMEOUT,
    } = options;

    // Validate repository URL
    const repoInfo = extractRepoInfo(repoUrl);
    if (!repoInfo) {
      throw new Error(`Invalid repository URL: ${repoUrl}`);
    }

    // Ensure target directory doesn't exist
    await rimraf(targetPath);

    const git = simpleGit();
    
    // Configure timeout (using environment variable since timeout property doesn't exist)
    process.env.GIT_TIMEOUT = timeout.toString();

    const cloneOptions: string[] = [];
    
    if (depth) {
      cloneOptions.push(`--depth=${depth}`);
    }
    
    if (single) {
      cloneOptions.push('--single-branch');
    }

    cloneOptions.push(`--branch=${branch}`);

    try {
      await git.clone(repoUrl, targetPath, cloneOptions);
      return new GitClient(targetPath);
    } catch (error: any) {
      await rimraf(targetPath); // Cleanup on failure
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  async getCommitInfo(sha?: string): Promise<GitCommitInfo> {
    try {
      const log = await this.git.log({
        from: sha,
        to: sha,
        maxCount: 1,
        format: {
          hash: '%H',
          date: '%ai',
          message: '%s',
          author_name: '%an',
          author_email: '%ae',
          refs: '%D',
          body: '%b',
        },
      });

      if (!log.latest) {
        throw new Error(`Commit not found: ${sha}`);
      }

      const commit = log.latest;
      const stats = await this.getCommitStats(commit.hash);
      const files = await this.getCommitFiles(commit.hash);

      return {
        sha: commit.hash,
        message: commit.message,
        author: {
          name: commit.author_name,
          email: commit.author_email,
        },
        date: new Date(commit.date),
        files,
        stats,
      };
    } catch (error: any) {
      throw new Error(`Failed to get commit info: ${error.message}`);
    }
  }

  async getCommitStats(sha: string): Promise<{ additions: number; deletions: number; total: number }> {
    try {
      const diff = await this.git.diffSummary([`${sha}^`, sha]);
      
      return {
        additions: diff.insertions,
        deletions: diff.deletions,
        total: diff.files.length,
      };
    } catch (error) {
      // Fallback for initial commit
      try {
        const diff = await this.git.diffSummary(['4b825dc642cb6eb9a060e54bf8d69288fbee4904', sha]);
        return {
          additions: diff.insertions,
          deletions: diff.deletions,
          total: diff.files.length,
        };
      } catch {
        return { additions: 0, deletions: 0, total: 0 };
      }
    }
  }

  async getCommitFiles(sha: string): Promise<string[]> {
    try {
      const result = await this.git.raw(['diff-tree', '--no-commit-id', '--name-only', '-r', sha]);
      return result.trim().split('\n').filter(Boolean);
    } catch (error) {
      try {
        // Fallback for initial commit
        const result = await this.git.raw(['ls-tree', '--name-only', '-r', sha]);
        return result.trim().split('\n').filter(Boolean);
      } catch {
        return [];
      }
    }
  }

  async getDiff(sha: string): Promise<string> {
    try {
      return await this.git.show([sha, '--format=', '--no-merges']);
    } catch (error: any) {
      throw new Error(`Failed to get diff: ${error.message}`);
    }
  }

  async getFileContent(filePath: string, sha?: string): Promise<string> {
    try {
      if (sha) {
        return await this.git.show([`${sha}:${filePath}`]);
      } else {
        const fullPath = join(this.repoPath, filePath);
        return await fs.readFile(fullPath, 'utf-8');
      }
    } catch (error: any) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  async getCommitHistory(limit: number = 10, since?: Date): Promise<GitCommitInfo[]> {
    try {
      const logOptions: any = {
        maxCount: limit,
        format: {
          hash: '%H',
          date: '%ai',
          message: '%s',
          author_name: '%an',
          author_email: '%ae',
        },
      };

      if (since) {
        logOptions.since = since.toISOString();
      }

      const log: LogResult = await this.git.log(logOptions);
      
      const commits = await Promise.all(
        log.all.map(async commit => {
          const stats = await this.getCommitStats(commit.hash);
          const files = await this.getCommitFiles(commit.hash);

          return {
            sha: commit.hash,
            message: commit.message,
            author: {
              name: commit.author_name,
              email: commit.author_email,
            },
            date: new Date(commit.date),
            files,
            stats,
          };
        })
      );

      return commits;
    } catch (error: any) {
      throw new Error(`Failed to get commit history: ${error.message}`);
    }
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const branches = await this.git.branch();
      return branches.current;
    } catch (error: any) {
      throw new Error(`Failed to get current branch: ${error.message}`);
    }
  }

  async getAllBranches(): Promise<string[]> {
    try {
      const branches = await this.git.branch();
      return branches.all.map(branch => branch.replace('remotes/origin/', ''));
    } catch (error: any) {
      throw new Error(`Failed to get branches: ${error.message}`);
    }
  }

  async switchBranch(branch: string): Promise<void> {
    try {
      await this.git.checkout(branch);
    } catch (error: any) {
      throw new Error(`Failed to switch to branch ${branch}: ${error.message}`);
    }
  }

  async getStatus(): Promise<StatusResult> {
    try {
      return await this.git.status();
    } catch (error: any) {
      throw new Error(`Failed to get status: ${error.message}`);
    }
  }

  async getRemoteUrl(): Promise<string> {
    try {
      const remotes = await this.git.getRemotes(true);
      const origin = remotes.find(remote => remote.name === 'origin');
      return origin?.refs?.fetch || '';
    } catch (error: any) {
      throw new Error(`Failed to get remote URL: ${error.message}`);
    }
  }

  async cleanup(): Promise<void> {
    try {
      await rimraf(this.repoPath);
    } catch (error: any) {
      console.warn(`Failed to cleanup repository: ${error.message}`);
    }
  }

  getRepoPath(): string {
    return this.repoPath;
  }
}