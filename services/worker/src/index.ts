import dotenv from 'dotenv';
import { WorkerService } from './worker-service';
import { logger } from './utils/logger';
import { gracefulShutdown } from './utils/shutdown';

// Load environment variables
dotenv.config();

async function main() {
  try {
    logger.info('🚀 Starting RulAItem Worker Service');

    // Initialize worker service
    const workerService = new WorkerService();
    await workerService.initialize();

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown(workerService));
    process.on('SIGINT', () => gracefulShutdown(workerService));
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      gracefulShutdown(workerService);
    });
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      gracefulShutdown(workerService);
    });

    logger.info('✅ Worker Service started successfully');
  } catch (error) {
    logger.error('❌ Failed to start Worker Service:', error);
    process.exit(1);
  }
}

main();