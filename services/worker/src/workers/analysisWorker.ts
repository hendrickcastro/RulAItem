import { Worker, Job } from 'bullmq';
import { AnalysisJobData } from '@kontexto/core';
import { GitService } from '../services/gitService';
import { ParserService } from '../services/parserService';
import { LLMService } from '../services/llmService';
import { StorageService } from '../services/storageService';
import { logger } from '../utils/logger';

export class AnalysisWorker {
  private worker: Worker;

  constructor(
    private gitService: GitService,
    private parserService: ParserService,
    private llmService: LLMService,
    private storageService: StorageService
  ) {
    this.worker = new Worker('analysis', this.processJob.bind(this), {
      connection: { 
        host: process.env.REDIS_HOST || 'redis', 
        port: parseInt(process.env.REDIS_PORT || '6379') 
      },
      concurrency: 3,
      limiter: {
        max: 10,
        duration: 60000 // 10 jobs per minute
      }
    });

    this.worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed:`, err);
    });

    logger.info('Analysis worker initialized');
  }

  private async processJob(job: Job<AnalysisJobData>) {
    const { analysisId, repoId, commitSha, repoUrl, branch } = job.data;
    
    try {
      logger.info(`Processing analysis job ${job.id} for commit ${commitSha}`);
      
      // Update status to processing
      await job.updateProgress(10);
      await this.updateJobStatus(analysisId, 'processing');

      // 1. Clone repository
      logger.info(`Cloning repository: ${repoUrl}`);
      const repoPath = await this.gitService.cloneRepo(repoUrl, branch);
      await job.updateProgress(30);

      // 2. Analyze commit diff
      logger.info(`Analyzing commit diff: ${commitSha}`);
      const diff = await this.gitService.getCommitDiff(repoPath, commitSha);
      await job.updateProgress(50);

      // 3. Parse modified files
      logger.info(`Parsing ${diff.modifiedFiles.length} modified files`);
      const parsedFiles = await this.parserService.parseFiles(
        diff.modifiedFiles,
        repoPath
      );
      await job.updateProgress(70);

      // 4. Generate documentation with LLM
      logger.info('Generating documentation with LLM');
      const documentation = await this.llmService.generateDocumentation({
        diff,
        parsedFiles,
        context: await this.getRepoContext(repoPath)
      });
      await job.updateProgress(90);

      // 5. Save results
      logger.info('Saving analysis results');
      await this.storageService.saveAnalysis({
        analysisId,
        repoId,
        commitSha,
        documentation,
        metrics: this.calculateMetrics(diff, parsedFiles),
        completedAt: new Date()
      });

      // 6. Cleanup
      await this.gitService.cleanup(repoPath);
      await job.updateProgress(100);

      logger.info(`Analysis job ${job.id} completed successfully`);
      return { success: true, analysisId };

    } catch (error) {
      logger.error(`Analysis job ${job.id} failed:`, error);
      await this.updateJobStatus(analysisId, 'failed', error.message);
      throw error;
    }
  }

  private async updateJobStatus(
    analysisId: string,
    status: string,
    error?: string
  ) {
    await this.storageService.updateAnalysisStatus(analysisId, {
      status,
      error,
      updatedAt: new Date()
    });
  }

  private async getRepoContext(repoPath: string) {
    // Get repository context (README, package.json, etc.)
    return await this.gitService.getRepoContext(repoPath);
  }

  private calculateMetrics(diff: any, parsedFiles: any[]) {
    return {
      linesAdded: diff.stats.additions,
      linesRemoved: diff.stats.deletions,
      filesModified: diff.modifiedFiles.length,
      complexity: this.calculateComplexity(parsedFiles),
      testCoverage: this.estimateTestCoverage(parsedFiles)
    };
  }

  private calculateComplexity(parsedFiles: any[]): number {
    // Simplified complexity calculation
    return parsedFiles.reduce((total, file) => {
      return total + (file.functions?.length || 0) + (file.classes?.length || 0);
    }, 0);
  }

  private estimateTestCoverage(parsedFiles: any[]): number {
    // Simplified test coverage estimation
    const testFiles = parsedFiles.filter(f => 
      f.path.includes('test') || f.path.includes('spec')
    );
    return testFiles.length > 0 ? (testFiles.length / parsedFiles.length) * 100 : 0;
  }

  async close() {
    await this.worker.close();
    logger.info('Analysis worker closed');
  }
}
