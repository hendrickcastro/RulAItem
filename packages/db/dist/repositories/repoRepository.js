"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepoRepository = void 0;
const core_1 = require("@kontexto/core");
const baseRepository_1 = require("./baseRepository");
class RepoRepository extends baseRepository_1.BaseRepository {
    constructor() {
        super('repos', core_1.RepoSchema);
    }
    async findByUserId(userId) {
        return this.findWhere('userId', '==', userId);
    }
    async findByGithubId(githubId) {
        const results = await this.findWhere('githubId', '==', githubId, 1);
        return results[0] || null;
    }
    async findByUrl(url) {
        const results = await this.findWhere('url', '==', url, 1);
        return results[0] || null;
    }
    async getUserRepos(userId, options = {}) {
        const { page = 1, limit = 10, search } = options;
        let query = this.collection.where('userId', '==', userId);
        if (search) {
            query = query.where('name', '>=', search)
                .where('name', '<=', search + '\uf8ff');
        }
        const snapshot = await query
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .offset((page - 1) * limit)
            .get();
        const repos = snapshot.docs.map(doc => {
            const data = { id: doc.id, ...doc.data() };
            return core_1.RepoSchema.parse(data);
        });
        const totalSnapshot = await this.collection
            .where('userId', '==', userId)
            .count()
            .get();
        return {
            repos,
            total: totalSnapshot.data().count
        };
    }
}
exports.RepoRepository = RepoRepository;
//# sourceMappingURL=repoRepository.js.map