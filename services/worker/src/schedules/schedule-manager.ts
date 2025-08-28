import cron from 'node-cron';
import { JobQueue } from '../queue/job-queue';
import { jobsRepository, webhooksRepository } from '@kontexto/db';
import { JOB_TYPES } from '@kontexto/core';
import { logger } from '../utils/logger';

export class ScheduleManager {
  private tasks: cron.ScheduledTask[] = [];
  private isInitialized = false;

  constructor(private jobQueue: JobQueue) {}

  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Cleanup old jobs every day at 2 AM
    this.scheduleTask(
      '0 2 * * *',
      'cleanup-jobs',
      this.cleanupOldJobs.bind(this)
    );

    // Cleanup old webhook events every day at 3 AM
    this.scheduleTask(
      '0 3 * * *', 
      'cleanup-webhooks',
      this.cleanupOldWebhooks.bind(this)
    );

    // Health check every 5 minutes
    this.scheduleTask(
      '*/5 * * * *',
      'health-check',
      this.performHealthCheck.bind(this)
    );

    // Process pending webhook events every minute
    this.scheduleTask(
      '* * * * *',
      'process-webhooks',
      this.processWebhookEvents.bind(this)
    );

    this.isInitialized = true;
    logger.info(`✅ Schedule manager initialized with ${this.tasks.length} tasks`);
  }

  private scheduleTask(pattern: string, name: string, handler: () => Promise<void>): void {
    const task = cron.schedule(pattern, async () => {
      try {
        logger.debug(`Running scheduled task: ${name}`);
        await handler();
      } catch (error) {
        logger.error(`Scheduled task ${name} failed:`, error);
      }
    }, {
      scheduled: false // Don't start immediately
    });

    this.tasks.push(task);
    task.start();
    logger.info(`Scheduled task: ${name} (${pattern})`);
  }

  private async cleanupOldJobs(): Promise<void> {
    try {
      const deletedCount = await jobsRepository.cleanupOldJobs(7); // 7 days
      logger.info(`Cleaned up ${deletedCount} old jobs`);
    } catch (error) {
      logger.error('Failed to cleanup old jobs:', error);
    }
  }

  private async cleanupOldWebhooks(): Promise<void> {
    try {
      const deletedCount = await webhooksRepository.cleanupOldEvents(3); // 3 days  
      logger.info(`Cleaned up ${deletedCount} old webhook events`);
    } catch (error) {
      logger.error('Failed to cleanup old webhooks:', error);
    }
  }

  private async performHealthCheck(): Promise<void> {
    try {
      // Check job queue health
      const stats = await this.jobQueue.getStats();
      
      // Log warnings for concerning queue states
      for (const [queueName, queueStats] of Object.entries(stats)) {
        if (queueStats.failed > 10) {
          logger.warn(`Queue ${queueName} has ${queueStats.failed} failed jobs`);
        }
        
        if (queueStats.waiting > 100) {
          logger.warn(`Queue ${queueName} has ${queueStats.waiting} waiting jobs`);
        }
      }

      logger.debug('Health check completed');
    } catch (error) {
      logger.error('Health check failed:', error);
    }
  }

  private async processWebhookEvents(): Promise<void> {
    try {
      // Get unprocessed webhook events
      const events = await webhooksRepository.findUnprocessed(10);
      
      for (const event of events) {
        try {
          // Process webhook based on source and event type
          await this.processWebhookEvent(event);
          
          // Mark as processed
          await webhooksRepository.markAsProcessed(event.id);
          
        } catch (error) {
          logger.error(`Failed to process webhook event ${event.id}:`, error);
          // Don't mark as processed so it can be retried
        }
      }

      if (events.length > 0) {
        logger.info(`Processed ${events.length} webhook events`);
      }
    } catch (error) {
      logger.error('Failed to process webhook events:', error);
    }
  }

  private async processWebhookEvent(event: any): Promise<void> {
    const { source, event: eventType, payload } = event;

    // Handle GitHub webhooks
    if (source === 'github' && eventType === 'push') {
      const { repository, commits, ref } = payload;
      
      if (!commits || commits.length === 0) {
        return;
      }

      // Find context for this repository
      // Note: This is simplified - in production you'd have better repo matching
      const repoUrl = repository.clone_url || repository.html_url;
      
      // Queue commit analysis jobs
      for (const commit of commits.slice(0, 5)) { // Limit to 5 most recent commits
        await this.jobQueue.addJob(JOB_TYPES.ANALYZE_COMMIT, {
          jobId: `webhook-${event.id}-${commit.id}`,
          commitSha: commit.id,
          repoUrl,
          branch: ref.replace('refs/heads/', ''),
          webhookEventId: event.id,
        });
      }
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    logger.info('Shutting down schedule manager...');

    // Stop all scheduled tasks
    for (const task of this.tasks) {
      task.stop();
      task.destroy();
    }

    this.tasks = [];
    this.isInitialized = false;

    logger.info('✅ Schedule manager shutdown complete');
  }
}