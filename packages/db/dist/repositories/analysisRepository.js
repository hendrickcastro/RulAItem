"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisRepository = void 0;
const core_1 = require("@kontexto/core");
const baseRepository_1 = require("./baseRepository");
class AnalysisRepository extends baseRepository_1.BaseRepository {
    constructor() {
        super('analysis', core_1.AnalysisSchema);
    }
    async findByRepoId(repoId, options = {}) {
        const { status, limit = 50 } = options;
        let query = this.collection.where('repoId', '==', repoId);
        if (status) {
            query = query.where('status', '==', status);
        }
        const snapshot = await query
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => {
            const data = { id: doc.id, ...doc.data() };
            return core_1.AnalysisSchema.parse(data);
        });
    }
    async findByCommitSha(commitSha) {
        const results = await this.findWhere('commitSha', '==', commitSha, 1);
        return results[0] || null;
    }
    async updateStatus(id, status, error) {
        const updateData = { status };
        if (status === 'processing') {
            updateData.startedAt = new Date();
        }
        else if (status === 'completed') {
            updateData.completedAt = new Date();
        }
        else if (status === 'failed' && error) {
            updateData.error = error;
        }
        return this.update(id, updateData);
    }
    async getMetrics(repoId, timeframe) {
        const now = new Date();
        const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const snapshot = await this.collection
            .where('repoId', '==', repoId)
            .where('createdAt', '>=', startDate)
            .get();
        const analyses = snapshot.docs.map(doc => doc.data());
        const completed = analyses.filter(a => a.status === 'completed');
        const totalProcessingTime = completed.reduce((sum, a) => sum + (a.processingTime || 0), 0);
        return {
            count: analyses.length,
            completed: completed.length,
            failed: analyses.filter(a => a.status === 'failed').length,
            avgTime: completed.length > 0 ? totalProcessingTime / completed.length : 0,
            successRate: analyses.length > 0 ? (completed.length / analyses.length) * 100 : 0,
            languages: this.extractLanguages(completed),
            frequency: this.calculateFrequency(analyses, days)
        };
    }
    extractLanguages(analyses) {
        // Simplified language extraction - would need more sophisticated logic
        return ['TypeScript', 'JavaScript', 'Python'];
    }
    calculateFrequency(analyses, days) {
        return Math.round(analyses.length / days * 7); // Weekly frequency
    }
}
exports.AnalysisRepository = AnalysisRepository;
//# sourceMappingURL=analysisRepository.js.map