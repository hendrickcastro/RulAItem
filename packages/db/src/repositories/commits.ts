import { Commit, CommitSchema } from '@kontexto/core';
import { BaseRepository } from './base';

export class CommitsRepository extends BaseRepository<Commit> {
  constructor() {
    super('commits', CommitSchema);
  }

  async findByContexto(contextoId: string, limit: number = 20): Promise<Commit[]> {
    const snapshot = await this.collection
      .where('contextoId', '==', contextoId)
      .orderBy('date', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }

  async findBySha(sha: string): Promise<Commit | null> {
    const snapshot = await this.collection
      .where('sha', '==', sha)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.deserializeData(snapshot.docs[0]);
  }

  async findByAuthor(authorEmail: string, limit: number = 20): Promise<Commit[]> {
    const snapshot = await this.collection
      .where('author.email', '==', authorEmail)
      .orderBy('date', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }

  async getCommitStats(contextoId: string): Promise<{
    totalCommits: number;
    totalAdditions: number;
    totalDeletions: number;
    uniqueAuthors: number;
  }> {
    const snapshot = await this.collection
      .where('contextoId', '==', contextoId)
      .get();

    const commits = snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
    const authors = new Set(commits.map(c => c.author.email));

    return {
      totalCommits: commits.length,
      totalAdditions: commits.reduce((sum, c) => sum + c.additions, 0),
      totalDeletions: commits.reduce((sum, c) => sum + c.deletions, 0),
      uniqueAuthors: authors.size,
    };
  }

  async getCommitActivity(
    contextoId: string,
    days: number = 30
  ): Promise<Array<{ date: string; commits: number; additions: number; deletions: number }>> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const snapshot = await this.collection
      .where('contextoId', '==', contextoId)
      .where('date', '>=', since)
      .orderBy('date', 'asc')
      .get();

    const commits = snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
    
    // Group by date
    const activityMap = new Map<string, { commits: number; additions: number; deletions: number }>();
    
    commits.forEach(commit => {
      const dateKey = commit.date.toISOString().split('T')[0];
      const existing = activityMap.get(dateKey) || { commits: 0, additions: 0, deletions: 0 };
      
      activityMap.set(dateKey, {
        commits: existing.commits + 1,
        additions: existing.additions + commit.additions,
        deletions: existing.deletions + commit.deletions,
      });
    });

    // Convert to array and fill missing dates
    const result: Array<{ date: string; commits: number; additions: number; deletions: number }> = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(since);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      const activity = activityMap.get(dateKey) || { commits: 0, additions: 0, deletions: 0 };
      result.push({
        date: dateKey,
        ...activity,
      });
    }

    return result;
  }

  async getMostActiveAuthors(
    contextoId: string,
    limit: number = 5
  ): Promise<Array<{ author: string; commits: number; additions: number; deletions: number }>> {
    const snapshot = await this.collection
      .where('contextoId', '==', contextoId)
      .get();

    const commits = snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
    
    // Group by author
    const authorMap = new Map<string, { commits: number; additions: number; deletions: number }>();
    
    commits.forEach(commit => {
      const author = commit.author.email;
      const existing = authorMap.get(author) || { commits: 0, additions: 0, deletions: 0 };
      
      authorMap.set(author, {
        commits: existing.commits + 1,
        additions: existing.additions + commit.additions,
        deletions: existing.deletions + commit.deletions,
      });
    });

    // Convert to array and sort by commits
    const result = Array.from(authorMap.entries())
      .map(([author, stats]) => ({ author, ...stats }))
      .sort((a, b) => b.commits - a.commits)
      .slice(0, limit);

    return result;
  }
}

export const commitsRepository = new CommitsRepository();