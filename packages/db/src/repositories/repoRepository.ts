import { Repo, RepoSchema, CreateRepoData } from '@kontexto/core';
import { BaseRepository } from './baseRepository';

export class RepoRepository extends BaseRepository<Repo> {
  constructor() {
    super('repos', RepoSchema);
  }

  async findByUserId(userId: string): Promise<Repo[]> {
    return this.findWhere('userId', '==', userId);
  }

  async findByGithubId(githubId: number): Promise<Repo | null> {
    const results = await this.findWhere('githubId', '==', githubId, 1);
    return results[0] || null;
  }

  async findByUrl(url: string): Promise<Repo | null> {
    const results = await this.findWhere('url', '==', url, 1);
    return results[0] || null;
  }

  async getUserRepos(userId: string, options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<{ repos: Repo[]; total: number }> {
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
      const data = { id: doc.id, ...doc.data() } as Repo;
      return RepoSchema.parse(data);
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
