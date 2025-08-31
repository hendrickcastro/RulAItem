import { Job, JobSchema, JOB_STATUS } from '@kontexto/core';
import { BaseRepository } from './base';

export class JobsRepository extends BaseRepository<Job> {
  constructor() {
    super('jobs', JobSchema);
  }

  async findPendingJobs(limit: number = 10): Promise<Job[]> {
    const snapshot = await this.collection
      .where('status', '==', JOB_STATUS.PENDING)
      .orderBy('createdAt', 'asc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }

  async findByStatus(status: string, limit: number = 20): Promise<Job[]> {
    const snapshot = await this.collection
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }

  async findByType(type: string, limit: number = 20): Promise<Job[]> {
    // Temporary fix: Remove orderBy to avoid Firestore composite index requirement
    const snapshot = await this.collection
      .where('type', '==', type)
      .limit(limit)
      .get();

    // Sort in memory instead of database (less efficient but works without index)
    const jobs = snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
    return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markAsProcessing(jobId: string): Promise<Job | null> {
    return this.update(jobId, {
      status: JOB_STATUS.PROCESSING,
      updatedAt: new Date(),
    } as any);
  }

  async markAsCompleted(jobId: string, result: any): Promise<Job | null> {
    return this.update(jobId, {
      status: JOB_STATUS.COMPLETED,
      result,
      completedAt: new Date(),
      updatedAt: new Date(),
    } as any);
  }

  async markAsFailed(jobId: string, error: string, shouldRetry: boolean = false): Promise<Job | null> {
    const job = await this.findById(jobId);
    if (!job) return null;

    const attempts = job.attempts + 1;
    const canRetry = shouldRetry && attempts < job.maxAttempts;

    return this.update(jobId, {
      status: canRetry ? JOB_STATUS.PENDING : JOB_STATUS.FAILED,
      error,
      attempts,
      updatedAt: new Date(),
    } as any);
  }

  async getJobStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    const snapshot = await this.collection.get();
    const jobs = snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);

    return {
      pending: jobs.filter(j => j.status === JOB_STATUS.PENDING).length,
      processing: jobs.filter(j => j.status === JOB_STATUS.PROCESSING).length,
      completed: jobs.filter(j => j.status === JOB_STATUS.COMPLETED).length,
      failed: jobs.filter(j => j.status === JOB_STATUS.FAILED).length,
      total: jobs.length,
    };
  }

  async getProcessingJobs(): Promise<Job[]> {
    const snapshot = await this.collection
      .where('status', '==', JOB_STATUS.PROCESSING)
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }

  async getFailedJobs(limit: number = 50): Promise<Job[]> {
    const snapshot = await this.collection
      .where('status', '==', JOB_STATUS.FAILED)
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }

  async retryJob(jobId: string): Promise<Job | null> {
    return this.update(jobId, {
      status: JOB_STATUS.PENDING,
      error: undefined,
      updatedAt: new Date(),
    } as any);
  }

  async cleanupOldJobs(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const snapshot = await this.collection
      .where('status', 'in', [JOB_STATUS.COMPLETED, JOB_STATUS.FAILED])
      .where('updatedAt', '<', cutoffDate)
      .get();

    const batch = this.collection.firestore.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    return snapshot.docs.length;
  }

  async getRecentActivity(limit: number = 10): Promise<Job[]> {
    const snapshot = await this.collection
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }
}

export const jobsRepository = new JobsRepository();