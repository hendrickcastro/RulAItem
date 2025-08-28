import { User, UserSchema } from '@kontexto/core';
import { BaseRepository } from './base';

export class UsersRepository extends BaseRepository<User> {
  constructor() {
    super('users', UserSchema);
  }

  async findByGithubId(githubId: string): Promise<User | null> {
    const snapshot = await this.collection
      .where('githubId', '==', githubId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.deserializeData(snapshot.docs[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const snapshot = await this.collection
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.deserializeData(snapshot.docs[0]);
  }

  async createOrUpdate(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    // Check if user exists by GitHub ID
    const existingUser = await this.findByGithubId(userData.githubId);
    
    if (existingUser) {
      // Update existing user
      return this.update(existingUser.id, {
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
      } as any) as Promise<User>;
    } else {
      // Create new user
      return this.create(userData as any);
    }
  }

  async searchByName(query: string, limit: number = 10): Promise<User[]> {
    const snapshot = await this.collection
      .orderBy('name')
      .startAt(query)
      .endAt(query + '\uf8ff')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }

  async getRecentUsers(limit: number = 10): Promise<User[]> {
    const snapshot = await this.collection
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }
}

export const usersRepository = new UsersRepository();