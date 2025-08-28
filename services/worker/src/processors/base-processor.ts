import { logger } from '../utils/logger';

export abstract class BaseProcessor {
  protected isInitialized = false;
  protected isShuttingDown = false;

  abstract initialize(): Promise<void>;
  abstract process(payload: any, updateProgress: (progress: number, message?: string) => void): Promise<any>;
  abstract shutdown(): Promise<void>;

  isReady(): boolean {
    return this.isInitialized && !this.isShuttingDown;
  }

  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        logger.warn(`Attempt ${attempt}/${maxAttempts} failed:`, error);
        
        if (attempt === maxAttempts) {
          throw error;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }

    throw new Error('All retry attempts failed');
  }

  protected validatePayload(payload: any, requiredFields: string[]): void {
    if (!payload) {
      throw new Error('Payload is required');
    }

    for (const field of requiredFields) {
      if (!payload[field]) {
        throw new Error(`Required field '${field}' is missing from payload`);
      }
    }
  }

  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}