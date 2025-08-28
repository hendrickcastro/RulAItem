import { Repo } from '@kontexto/core';
import { BaseRepository } from './baseRepository';
export declare class RepoRepository extends BaseRepository<Repo> {
    constructor();
    findByUserId(userId: string): Promise<Repo[]>;
    findByGithubId(githubId: number): Promise<Repo | null>;
    findByUrl(url: string): Promise<Repo | null>;
    getUserRepos(userId: string, options?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
        repos: Repo[];
        total: number;
    }>;
}
//# sourceMappingURL=repoRepository.d.ts.map