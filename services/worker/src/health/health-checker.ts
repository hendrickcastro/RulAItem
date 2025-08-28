import { JobQueue } from '../queue/job-queue';
import { JobProcessor } from '../processors/job-processor';
import { logger } from '../utils/logger';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: Record<string, {
    status: 'healthy' | 'unhealthy';
    message?: string;
    lastCheck: Date;
  }>;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export class HealthChecker {
  private startTime: Date;
  private lastHealthStatus: HealthStatus | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    private dependencies: {
      jobQueue: JobQueue;
      jobProcessor: JobProcessor;
    }
  ) {
    this.startTime = new Date();
  }

  initialize(): void {
    // Run health check every 30 seconds
    this.healthCheckInterval = setInterval(
      () => this.performHealthCheck(),
      30000
    );

    // Initial health check
    this.performHealthCheck();

    logger.info('✅ Health checker initialized');
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const status = await this.checkHealth();
      this.lastHealthStatus = status;

      if (status.status === 'unhealthy') {
        logger.error('System is unhealthy:', status);
      } else if (status.status === 'degraded') {
        logger.warn('System is degraded:', status);
      } else {
        logger.debug('Health check passed');
      }
    } catch (error) {
      logger.error('Health check failed:', error);
    }
  }

  async checkHealth(): Promise<HealthStatus> {
    const now = new Date();
    const services: HealthStatus['services'] = {};

    // Check job queue health
    try {
      const isQueueReady = this.dependencies.jobQueue.isReady();
      services.jobQueue = {
        status: isQueueReady ? 'healthy' : 'unhealthy',
        message: isQueueReady ? 'Queue is ready' : 'Queue is not ready',
        lastCheck: now,
      };
    } catch (error) {
      services.jobQueue = {
        status: 'unhealthy',
        message: `Queue check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: now,
      };
    }

    // Check job processor health
    try {
      const isProcessorReady = this.dependencies.jobProcessor.isReady();
      services.jobProcessor = {
        status: isProcessorReady ? 'healthy' : 'unhealthy',
        message: isProcessorReady ? 'Processor is ready' : 'Processor is not ready',
        lastCheck: now,
      };
    } catch (error) {
      services.jobProcessor = {
        status: 'unhealthy',
        message: `Processor check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: now,
      };
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memory = {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    };

    // Add memory health check
    services.memory = {
      status: memory.percentage > 90 ? 'unhealthy' : memory.percentage > 80 ? 'degraded' : 'healthy',
      message: `Memory usage: ${memory.percentage}% (${memory.used}MB/${memory.total}MB)`,
      lastCheck: now,
    };

    // Determine overall status
    const unhealthyServices = Object.values(services).filter(s => s.status === 'unhealthy');
    const degradedServices = Object.values(services).filter(s => s.status === 'degraded');

    let overallStatus: HealthStatus['status'];
    if (unhealthyServices.length > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedServices.length > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const uptime = Math.floor((now.getTime() - this.startTime.getTime()) / 1000);

    return {
      status: overallStatus,
      timestamp: now,
      services,
      uptime,
      memory,
    };
  }

  getStatus(): HealthStatus {
    if (!this.lastHealthStatus) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        services: {
          system: {
            status: 'unhealthy',
            message: 'Health check not initialized',
            lastCheck: new Date(),
          },
        },
        uptime: 0,
        memory: { used: 0, total: 0, percentage: 0 },
      };
    }

    return this.lastHealthStatus;
  }

  isHealthy(): boolean {
    const status = this.getStatus();
    return status.status === 'healthy';
  }

  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    logger.info('✅ Health checker shutdown complete');
  }
}