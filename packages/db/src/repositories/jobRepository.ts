import { Job, JobSchema, CreateJobData } from '@kontexto/core';
import { BaseRepository } from './baseRepository';

export class JobRepository extends BaseRepository<Job> {
  constructor() {
    super('jobs', JobSchema);
  }

  async findByStatus(status: Job['status'], limit = 50): Promise<Job[]> {
    return this.findWhere('status', '==', status, limit);
  }

  async findByType(type: Job['type'], limit = 50): Promise<Job[]> {
    return this.findWhere('type', '==', type, limit);
  }

  async getQueuedJobs(priority?: Job['priority']): Promise<Job[]> {
    let query = this.collection.where('status', '==', 'queued');
    
    if (priority) {
      query = query.where('priority', '==', priority);
    }
    
    const snapshot = await query
      .orderBy('priority', 'desc')
      .orderBy('queuedAt', 'asc')
      .get();
    
    return snapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() } as Job;
      return JobSchema.parse(data);
    });
  }

  async updateStatus(id: string, status: Job['status'], result?: any, error?: string): Promise<Job> {
    const updateData: any = { status };
    
    if (status === 'processing') {
      updateData.startedAt = new Date();
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
      if (result) updateData.result = result;
    } else if (status === 'failed') {
      if (error) updateData.error = error;
    }
    
    return this.update(id, updateData);
  }

  async incrementAttempts(id: string): Promise<Job> {
    const job = await this.findById(id);
    if (!job) throw new Error('Job not found');
    
    const newAttempts = job.attempts + 1;
    const status = newAttempts >= job.maxAttempts ? 'failed' : 'retrying';
    
    return this.update(id, { 
      attempts: newAttempts, 
      status,
      updatedAt: new Date()
    });
  }
}
