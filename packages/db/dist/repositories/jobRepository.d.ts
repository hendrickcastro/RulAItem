import { Job } from '@kontexto/core';
import { BaseRepository } from './baseRepository';
export declare class JobRepository extends BaseRepository<Job> {
    constructor();
    findByStatus(status: Job['status'], limit?: number): Promise<Job[]>;
    findByType(type: Job['type'], limit?: number): Promise<Job[]>;
    getQueuedJobs(priority?: Job['priority']): Promise<Job[]>;
    updateStatus(id: string, status: Job['status'], result?: any, error?: string): Promise<Job>;
    incrementAttempts(id: string): Promise<Job>;
}
//# sourceMappingURL=jobRepository.d.ts.map