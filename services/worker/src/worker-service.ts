import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { JobQueue } from './queue/job-queue';
import { JobProcessor } from './processors/job-processor';
import { ScheduleManager } from './schedules/schedule-manager';
import { HealthChecker } from './health/health-checker';
import { logger } from './utils/logger';
import { firebaseClient } from '@kontexto/db';

export class WorkerService {
  private app: express.Application;
  private server: any;
  private jobQueue: JobQueue | null = null;
  private jobProcessor: JobProcessor | null = null;
  private scheduleManager: ScheduleManager | null = null;
  private healthChecker: HealthChecker | null = null;
  private isShuttingDown = false;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      const health = this.healthChecker?.getStatus() || { status: 'unknown' };
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });

    // Queue statistics
    this.app.get('/stats', async (req, res) => {
      try {
        if (!this.jobQueue) {
          return res.status(503).json({ error: 'Queue not initialized' });
        }

        const stats = await this.jobQueue.getStats();
        res.json(stats);
      } catch (error) {
        logger.error('Failed to get queue stats:', error);
        res.status(500).json({ error: 'Failed to get stats' });
      }
    });

    // Manual job trigger (for testing)
    this.app.post('/jobs/trigger', async (req, res) => {
      try {
        const { type, payload } = req.body;
        
        if (!this.jobQueue) {
          return res.status(503).json({ error: 'Queue not initialized' });
        }

        const jobId = await this.jobQueue.addJob(type, payload, {
          priority: 1,
          attempts: 3,
        });

        logger.info(`Manual job triggered: ${jobId}`);
        res.json({ jobId, message: 'Job queued successfully' });
      } catch (error) {
        logger.error('Failed to trigger job:', error);
        res.status(500).json({ error: 'Failed to trigger job' });
      }
    });

    // Queue management
    this.app.get('/jobs/:jobId', async (req, res) => {
      try {
        if (!this.jobQueue) {
          return res.status(503).json({ error: 'Queue not initialized' });
        }

        const job = await this.jobQueue.getJob(req.params.jobId);
        if (!job) {
          return res.status(404).json({ error: 'Job not found' });
        }

        res.json({
          id: job.id,
          name: job.name,
          data: job.data,
          progress: job.progress(),
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
          failedReason: job.failedReason,
        });
      } catch (error) {
        logger.error('Failed to get job:', error);
        res.status(500).json({ error: 'Failed to get job' });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    // Error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    });
  }

  async initialize(): Promise<void> {
    try {
      // Initialize Firebase
      firebaseClient.initialize();
      logger.info('✅ Firebase initialized');

      // Initialize job queue
      this.jobQueue = new JobQueue();
      await this.jobQueue.initialize();
      logger.info('✅ Job queue initialized');

      // Initialize job processor
      this.jobProcessor = new JobProcessor(this.jobQueue);
      await this.jobProcessor.initialize();
      logger.info('✅ Job processor initialized');

      // Initialize schedule manager
      this.scheduleManager = new ScheduleManager(this.jobQueue);
      this.scheduleManager.initialize();
      logger.info('✅ Schedule manager initialized');

      // Initialize health checker
      this.healthChecker = new HealthChecker({
        jobQueue: this.jobQueue,
        jobProcessor: this.jobProcessor,
      });
      this.healthChecker.initialize();
      logger.info('✅ Health checker initialized');

      // Start HTTP server
      const port = process.env.PORT || 3001;
      this.server = this.app.listen(port, () => {
        logger.info(`🌐 Worker service listening on port ${port}`);
      });

      // Set up server error handling
      this.server.on('error', (error: any) => {
        logger.error('Server error:', error);
      });

    } catch (error) {
      logger.error('Failed to initialize worker service:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    logger.info('🔄 Shutting down worker service...');

    try {
      // Stop accepting new connections
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server.close(() => resolve());
        });
        logger.info('✅ HTTP server closed');
      }

      // Stop schedule manager
      if (this.scheduleManager) {
        await this.scheduleManager.shutdown();
        logger.info('✅ Schedule manager stopped');
      }

      // Stop health checker
      if (this.healthChecker) {
        this.healthChecker.shutdown();
        logger.info('✅ Health checker stopped');
      }

      // Stop job processor (wait for current jobs to finish)
      if (this.jobProcessor) {
        await this.jobProcessor.shutdown();
        logger.info('✅ Job processor stopped');
      }

      // Close job queue
      if (this.jobQueue) {
        await this.jobQueue.close();
        logger.info('✅ Job queue closed');
      }

      logger.info('✅ Worker service shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown:', error);
      throw error;
    }
  }

  isHealthy(): boolean {
    return this.healthChecker?.isHealthy() || false;
  }
}