import dotenv from 'dotenv';
import { AnalysisWorker } from './workers/analysisWorker';
import { GitService } from './services/gitService';
import { ParserService } from './services/parserService';
import { LLMService } from './services/llmService';
import { StorageService } from './services/storageService';
import { logger } from './utils/logger';

dotenv.config();

async function main() {
  try {
    logger.info('Starting KONTEXTO IA Worker Service');

    // Initialize services
    const gitService = new GitService();
    const parserService = new ParserService();
    const llmService = new LLMService();
    const storageService = new StorageService();

    // Initialize workers
    const analysisWorker = new AnalysisWorker(
      gitService,
      parserService,
      llmService,
      storageService
    );

    logger.info('Worker service initialized successfully');

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      await analysisWorker.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully');
      await analysisWorker.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start worker service:', error);
    process.exit(1);
  }
}

main();
