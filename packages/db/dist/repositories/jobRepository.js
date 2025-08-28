"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRepository = void 0;
const core_1 = require("@kontexto/core");
const baseRepository_1 = require("./baseRepository");
class JobRepository extends baseRepository_1.BaseRepository {
    constructor() {
        super('jobs', core_1.JobSchema);
    }
    async findByStatus(status, limit = 50) {
        return this.findWhere('status', '==', status, limit);
    }
    async findByType(type, limit = 50) {
        return this.findWhere('type', '==', type, limit);
    }
    async getQueuedJobs(priority) {
        let query = this.collection.where('status', '==', 'queued');
        if (priority) {
            query = query.where('priority', '==', priority);
        }
        const snapshot = await query
            .orderBy('priority', 'desc')
            .orderBy('queuedAt', 'asc')
            .get();
        return snapshot.docs.map(doc => {
            const data = { id: doc.id, ...doc.data() };
            return core_1.JobSchema.parse(data);
        });
    }
    async updateStatus(id, status, result, error) {
        const updateData = { status };
        if (status === 'processing') {
            updateData.startedAt = new Date();
        }
        else if (status === 'completed') {
            updateData.completedAt = new Date();
            if (result)
                updateData.result = result;
        }
        else if (status === 'failed') {
            if (error)
                updateData.error = error;
        }
        return this.update(id, updateData);
    }
    async incrementAttempts(id) {
        const job = await this.findById(id);
        if (!job)
            throw new Error('Job not found');
        const newAttempts = job.attempts + 1;
        const status = newAttempts >= job.maxAttempts ? 'failed' : 'retrying';
        return this.update(id, {
            attempts: newAttempts,
            status,
            updatedAt: new Date()
        });
    }
}
exports.JobRepository = JobRepository;
//# sourceMappingURL=jobRepository.js.map