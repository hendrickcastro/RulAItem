import Queue from 'bull';
import { JobQueue } from '../queue/job-queue';
import { CommitAnalysisProcessor } from './commit-analysis-processor';
import { RepositoryAnalysisProcessor } from './repository-analysis-processor';
import { DocumentationProcessor } from './documentation-processor';
import { logger } from '../utils/logger';
import { JOB_TYPES, JOB_STATUS } from '@kontexto/core';
import { jobsRepository } from '@kontexto/db';

export class JobProcessor {
  private commitAnalysisProcessor: CommitAnalysisProcessor;
  private repositoryAnalysisProcessor: RepositoryAnalysisProcessor;
  private documentationProcessor: DocumentationProcessor;
  private isProcessing = false;

  constructor(private jobQueue: JobQueue) {
    this.commitAnalysisProcessor = new CommitAnalysisProcessor();
    this.repositoryAnalysisProcessor = new RepositoryAnalysisProcessor();
    this.documentationProcessor = new DocumentationProcessor();
  }

  async initialize(): Promise<void> {
    // Initialize processors
    await Promise.all([
      this.commitAnalysisProcessor.initialize(),
      this.repositoryAnalysisProcessor.initialize(),
      this.documentationProcessor.initialize(),
    ]);

    // Set up job processors for each queue
    this.setupJobProcessors();

    this.isProcessing = true;
    logger.info('✅ Job processor initialized and started');
  }

  private setupJobProcessors(): void {
    const queues = this.jobQueue.getAllQueues();

    // Analysis queue processor
    const analysisQueue = queues.get('analysis');
    if (analysisQueue) {
      analysisQueue.process('*', 5, this.createJobHandler());
    }

    // Repository queue processor
    const repoQueue = queues.get('repository');
    if (repoQueue) {
      repoQueue.process('*', 2, this.createJobHandler());
    }

    // Documentation queue processor
    const docsQueue = queues.get('documentation');
    if (docsQueue) {
      docsQueue.process('*', 3, this.createJobHandler());
    }

    // General queue processor
    const generalQueue = queues.get('general');
    if (generalQueue) {
      generalQueue.process('*', 10, this.createJobHandler());
    }
  }

  private createJobHandler() {
    return async (job: Queue.Job) => {
      const { type, payload } = job.data;
      
      try {
        logger.info(`Processing job ${job.id} of type ${type}`);

        // Update job status in database
        await this.updateJobStatus(payload.jobId, JOB_STATUS.PROCESSING);

        // Progress tracking
        const updateProgress = (progress: number, message?: string) => {
          job.progress(progress);
          if (message) {
            logger.info(`Job ${job.id}: ${message} (${progress}%)`);
          }
        };

        updateProgress(0, 'Starting job');

        let result: any;

        // Route to appropriate processor
        switch (type) {
          case JOB_TYPES.ANALYZE_COMMIT:
            result = await this.commitAnalysisProcessor.process(payload, updateProgress);
            break;

          case JOB_TYPES.ANALYZE_REPO:
            result = await this.repositoryAnalysisProcessor.process(payload, updateProgress);
            break;

          case JOB_TYPES.GENERATE_DOCS:
            result = await this.documentationProcessor.process(payload, updateProgress);
            break;

          default:
            throw new Error(`Unknown job type: ${type}`);
        }

        updateProgress(100, 'Job completed');

        // Update job status in database
        await this.updateJobStatus(payload.jobId, JOB_STATUS.COMPLETED, result);

        logger.info(`Job ${job.id} completed successfully`);
        return result;

      } catch (error) {
        logger.error(`Job ${job.id} failed:`, error);

        // Update job status in database
        await this.updateJobStatus(
          payload.jobId, 
          JOB_STATUS.FAILED, 
          null, 
          error instanceof Error ? error.message : 'Unknown error'
        );

        throw error;
      }
    };
  }

  private async updateJobStatus(
    jobId: string,
    status: string,
    result?: any,
    error?: string
  ): Promise<void> {
    try {
      if (status === JOB_STATUS.COMPLETED) {
        await jobsRepository.markAsCompleted(jobId, result);
      } else if (status === JOB_STATUS.FAILED) {
        await jobsRepository.markAsFailed(jobId, error || 'Unknown error', false);
      } else if (status === JOB_STATUS.PROCESSING) {
        await jobsRepository.markAsProcessing(jobId);
      }
    } catch (dbError) {
      logger.error(`Failed to update job ${jobId} status in database:`, dbError);
    }
  }

  async getProcessingStats(): Promise<{
    isProcessing: boolean;
    processorsStatus: Record<string, boolean>;
  }> {
    return {
      isProcessing: this.isProcessing,
      processorsStatus: {
        commitAnalysis: this.commitAnalysisProcessor.isReady(),
        repositoryAnalysis: this.repositoryAnalysisProcessor.isReady(),
        documentation: this.documentationProcessor.isReady(),
      },
    };
  }

  async shutdown(): Promise<void> {
    if (!this.isProcessing) {
      return;
    }

    logger.info('Shutting down job processor...');

    this.isProcessing = false;

    // Wait for current jobs to finish (with timeout)
    const timeout = 30000; // 30 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const queues = this.jobQueue.getAllQueues();
      let activeJobs = 0;

      for (const queue of queues.values()) {
        const active = await queue.getActive();
        activeJobs += active.length;
      }

      if (activeJobs === 0) {
        break;
      }

      logger.info(`Waiting for ${activeJobs} active jobs to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Shutdown processors
    await Promise.all([
      this.commitAnalysisProcessor.shutdown(),
      this.repositoryAnalysisProcessor.shutdown(),
      this.documentationProcessor.shutdown(),
    ]);

    logger.info('✅ Job processor shutdown complete');
  }

  isReady(): boolean {
    return this.isProcessing &&
           this.commitAnalysisProcessor.isReady() &&
           this.repositoryAnalysisProcessor.isReady() &&
           this.documentationProcessor.isReady();
  }
}