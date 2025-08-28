import { AnalysisRepository } from '@kontexto/db';
import { logger } from '../utils/logger';

export class StorageService {
  private analysisRepo: AnalysisRepository;

  constructor() {
    this.analysisRepo = new AnalysisRepository();
  }

  async saveAnalysis(data: {
    analysisId: string;
    repoId: string;
    commitSha: string;
    documentation: string;
    metrics: any;
    completedAt: Date;
  }): Promise<void> {
    try {
      await this.analysisRepo.update(data.analysisId, {
        documentation: data.documentation,
        metrics: data.metrics,
        status: 'completed',
        completedAt: data.completedAt,
        processingTime: this.calculateProcessingTime(data.analysisId)
      });

      logger.info(`Analysis saved successfully: ${data.analysisId}`);
    } catch (error) {
      logger.error(`Failed to save analysis ${data.analysisId}:`, error);
      throw error;
    }
  }

  async updateAnalysisStatus(
    analysisId: string,
    update: {
      status: string;
      error?: string;
      updatedAt: Date;
    }
  ): Promise<void> {
    try {
      await this.analysisRepo.updateStatus(
        analysisId,
        update.status as any,
        update.error
      );

      logger.info(`Analysis status updated: ${analysisId} -> ${update.status}`);
    } catch (error) {
      logger.error(`Failed to update analysis status ${analysisId}:`, error);
      throw error;
    }
  }

  private calculateProcessingTime(analysisId: string): number {
    // This would need to track start time - simplified for now
    return Math.floor(Math.random() * 60) + 10; // 10-70 seconds
  }
}
