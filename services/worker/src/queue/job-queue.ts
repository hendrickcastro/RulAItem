import Queue from 'bull';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { JOB_TYPES } from '@kontexto/core';

export interface JobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: number;
  removeOnFail?: number;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export class JobQueue {
  private redis: Redis | null = null;
  private queues: Map<string, Queue.Queue> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize Redis connection
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
      });

      // Test connection
      await this.redis.ping();
      logger.info('✅ Redis connection established');

      // Initialize queues for different job types
      this.initializeQueues();

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize job queue:', error);
      throw error;
    }
  }

  private initializeQueues(): void {
    const queueOptions = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential' as const,
          delay: 2000,
        },
      },
    };

    // Analysis queue - high priority
    const analysisQueue = new Queue('analysis', queueOptions);
    this.queues.set('analysis', analysisQueue);

    // Repository processing queue - medium priority
    const repoQueue = new Queue('repository', queueOptions);
    this.queues.set('repository', repoQueue);

    // Documentation generation queue - low priority
    const docsQueue = new Queue('documentation', queueOptions);
    this.queues.set('documentation', docsQueue);

    // General processing queue
    const generalQueue = new Queue('general', queueOptions);
    this.queues.set('general', generalQueue);

    // Set up queue event handlers
    for (const [name, queue] of this.queues) {
      this.setupQueueEventHandlers(name, queue);
    }

    logger.info(`✅ Initialized ${this.queues.size} job queues`);
  }

  private setupQueueEventHandlers(name: string, queue: Queue.Queue): void {
    queue.on('ready', () => {
      logger.info(`Queue ${name} is ready`);
    });

    queue.on('error', (error) => {
      logger.error(`Queue ${name} error:`, error);
    });

    queue.on('failed', (job, error) => {
      logger.error(`Job ${job.id} in queue ${name} failed:`, error);
    });

    queue.on('completed', (job) => {
      logger.info(`Job ${job.id} in queue ${name} completed`);
    });

    queue.on('stalled', (job) => {
      logger.warn(`Job ${job.id} in queue ${name} stalled`);
    });
  }

  async addJob(
    type: string,
    data: any,
    options: JobOptions = {}
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Job queue not initialized');
    }

    const queueName = this.getQueueNameForJobType(type);
    const queue = this.queues.get(queueName);

    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.add(type, data, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      attempts: options.attempts || 3,
      backoff: options.backoff || { type: 'exponential', delay: 2000 },
      removeOnComplete: options.removeOnComplete || 100,
      removeOnFail: options.removeOnFail || 50,
    });

    logger.info(`Added job ${job.id} of type ${type} to queue ${queueName}`);
    return job.id.toString();
  }

  private getQueueNameForJobType(jobType: string): string {
    switch (jobType) {
      case JOB_TYPES.ANALYZE_COMMIT:
        return 'analysis';
      case JOB_TYPES.ANALYZE_REPO:
        return 'repository';
      case JOB_TYPES.GENERATE_DOCS:
        return 'documentation';
      default:
        return 'general';
    }
  }

  async getJob(jobId: string): Promise<Queue.Job | null> {
    for (const queue of this.queues.values()) {
      const job = await queue.getJob(jobId);
      if (job) {
        return job;
      }
    }
    return null;
  }

  async getStats(): Promise<Record<string, QueueStats>> {
    if (!this.isInitialized) {
      throw new Error('Job queue not initialized');
    }

    const stats: Record<string, QueueStats> = {};

    for (const [name, queue] of this.queues) {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      stats[name] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        paused: await queue.isPaused(),
      };
    }

    return stats;
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.pause();
      logger.info(`Queue ${queueName} paused`);
    }
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.resume();
      logger.info(`Queue ${queueName} resumed`);
    }
  }

  async cleanQueue(queueName: string, grace: number = 5000): Promise<void> {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.clean(grace, 'completed');
      await queue.clean(grace, 'failed');
      logger.info(`Queue ${queueName} cleaned`);
    }
  }

  getQueue(name: string): Queue.Queue | undefined {
    return this.queues.get(name);
  }

  getAllQueues(): Map<string, Queue.Queue> {
    return this.queues;
  }

  async close(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    logger.info('Closing job queues...');

    // Close all queues
    for (const [name, queue] of this.queues) {
      await queue.close();
      logger.info(`Queue ${name} closed`);
    }

    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
      logger.info('Redis connection closed');
    }

    this.queues.clear();
    this.isInitialized = false;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}