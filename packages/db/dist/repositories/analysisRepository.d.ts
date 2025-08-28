import { Analysis } from '@kontexto/core';
import { BaseRepository } from './baseRepository';
export declare class AnalysisRepository extends BaseRepository<Analysis> {
    constructor();
    findByRepoId(repoId: string, options?: {
        status?: string;
        limit?: number;
    }): Promise<Analysis[]>;
    findByCommitSha(commitSha: string): Promise<Analysis | null>;
    updateStatus(id: string, status: Analysis['status'], error?: string): Promise<Analysis>;
    getMetrics(repoId: string, timeframe: string): Promise<{
        count: number;
        completed: number;
        failed: number;
        avgTime: number;
        successRate: number;
        languages: string[];
        frequency: number;
    }>;
    private extractLanguages;
    private calculateFrequency;
}
//# sourceMappingURL=analysisRepository.d.ts.map