import { WorkerService } from '../worker-service';
import { logger } from './logger';

export async function gracefulShutdown(workerService: WorkerService): Promise<void> {
  logger.info('🔄 Received shutdown signal, initiating graceful shutdown...');

  const shutdownTimeout = 30000; // 30 seconds
  
  const shutdownPromise = workerService.shutdown();
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Shutdown timeout exceeded'));
    }, shutdownTimeout);
  });

  try {
    await Promise.race([shutdownPromise, timeoutPromise]);
    logger.info('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Graceful shutdown failed:', error);
    process.exit(1);
  }
}