import { simpleGit, SimpleGit } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import { CommitDiff } from '@kontexto/core';
import { logger } from '../utils/logger';

export class GitService {
  private tempDir = '/tmp/git-repos';

  constructor() {
    // Ensure temp directory exists
    fs.ensureDirSync(this.tempDir);
  }

  async cloneRepo(repoUrl: string, branch: string = 'main'): Promise<string> {
    const repoName = this.extractRepoName(repoUrl);
    const repoPath = path.join(this.tempDir, `${repoName}-${Date.now()}`);

    try {
      const git = simpleGit();
      await git.clone(repoUrl, repoPath, ['--depth', '1', '--branch', branch]);
      logger.info(`Repository cloned successfully: ${repoPath}`);
      return repoPath;
    } catch (error) {
      logger.error(`Failed to clone repository ${repoUrl}:`, error);
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  async getCommitDiff(repoPath: string, commitSha: string): Promise<CommitDiff> {
    try {
      const git = simpleGit(repoPath);
      
      // Get commit info
      const commit = await git.show([commitSha, '--format=%H|%s|%an|%ae|%ai', '--name-status']);
      const lines = commit.split('\n');
      const [sha, message, authorName, authorEmail, timestamp] = lines[0].split('|');

      // Get diff stats
      const diffStat = await git.diff([`${commitSha}^`, commitSha, '--numstat']);
      const modifiedFiles = this.parseDiffStat(diffStat);

      // Get total stats
      const stats = await git.diff([`${commitSha}^`, commitSha, '--shortstat']);
      const statsMatch = stats.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
      
      return {
        sha: commitSha,
        message,
        author: { name: authorName, email: authorEmail },
        timestamp,
        modifiedFiles,
        stats: {
          total: parseInt(statsMatch?.[1] || '0'),
          additions: parseInt(statsMatch?.[2] || '0'),
          deletions: parseInt(statsMatch?.[3] || '0')
        }
      };
    } catch (error) {
      logger.error(`Failed to get commit diff for ${commitSha}:`, error);
      throw new Error(`Failed to get commit diff: ${error.message}`);
    }
  }

  async getRepoContext(repoPath: string): Promise<any> {
    try {
      const context: any = {};

      // Read README
      const readmePath = path.join(repoPath, 'README.md');
      if (await fs.pathExists(readmePath)) {
        context.readme = await fs.readFile(readmePath, 'utf-8');
      }

      // Read package.json
      const packagePath = path.join(repoPath, 'package.json');
      if (await fs.pathExists(packagePath)) {
        context.packageJson = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
      }

      // Get file structure
      context.structure = await this.getFileStructure(repoPath);

      return context;
    } catch (error) {
      logger.error(`Failed to get repo context:`, error);
      return {};
    }
  }

  async cleanup(repoPath: string): Promise<void> {
    try {
      await fs.remove(repoPath);
      logger.info(`Cleaned up repository: ${repoPath}`);
    } catch (error) {
      logger.error(`Failed to cleanup repository ${repoPath}:`, error);
    }
  }

  private extractRepoName(repoUrl: string): string {
    const match = repoUrl.match(/\/([^\/]+)\.git$/);
    return match ? match[1] : 'repo';
  }

  private parseDiffStat(diffStat: string): any[] {
    return diffStat
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [additions, deletions, path] = line.split('\t');
        return {
          path,
          status: 'modified' as const,
          additions: parseInt(additions) || 0,
          deletions: parseInt(deletions) || 0
        };
      });
  }

  private async getFileStructure(repoPath: string, maxDepth = 3): Promise<string[]> {
    try {
      const files: string[] = [];
      
      const scanDir = async (dir: string, depth = 0) => {
        if (depth > maxDepth) return;
        
        const items = await fs.readdir(dir);
        for (const item of items) {
          if (item.startsWith('.')) continue;
          
          const itemPath = path.join(dir, item);
          const relativePath = path.relative(repoPath, itemPath);
          const stat = await fs.stat(itemPath);
          
          if (stat.isDirectory()) {
            files.push(`${relativePath}/`);
            await scanDir(itemPath, depth + 1);
          } else {
            files.push(relativePath);
          }
        }
      };
      
      await scanDir(repoPath);
      return files;
    } catch (error) {
      logger.error('Failed to get file structure:', error);
      return [];
    }
  }
}
