import { FieldPath, Query } from 'firebase-admin/firestore';
import { Contexto, ContextoSchema, CreateContexto, UpdateContexto } from '@kontexto/core';
import { BaseRepository } from './base';

export class ContextosRepository extends BaseRepository<Contexto> {
  constructor() {
    super('contextos', ContextoSchema);
  }

  async createContexto(data: CreateContexto): Promise<Contexto> {
    return this.create(data as any);
  }

  async updateContexto(id: string, data: UpdateContexto): Promise<Contexto | null> {
    return this.update(id, data as any);
  }

  async findByResponsable(responsableId: string): Promise<Contexto[]> {
    // Simplified query to avoid composite index requirement
    const snapshot = await this.collection
      .where('responsableId', '==', responsableId)
      .get();

    // Filter and sort in memory for now
    const docs = snapshot.docs
      .map(doc => this.deserializeData(doc)!)
      .filter(contexto => contexto && contexto.isActive)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return docs;
  }

  async findByRepoUrl(repoUrl: string): Promise<Contexto | null> {
    const snapshot = await this.collection
      .where('repoUrl', '==', repoUrl)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.deserializeData(snapshot.docs[0]);
  }

  async searchByName(query: string, limit: number = 10): Promise<Contexto[]> {
    // Simple text search - in production, use Algolia or similar
    const snapshot = await this.collection
      .where('isActive', '==', true)
      .orderBy('nombre')
      .startAt(query)
      .endAt(query + '\uf8ff')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }

  async findByTags(tags: string[]): Promise<Contexto[]> {
    if (tags.length === 0) return [];

    const snapshot = await this.collection
      .where('tags', 'array-contains-any', tags)
      .where('isActive', '==', true)
      .orderBy('updatedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }

  async getActiveCount(): Promise<number> {
    const snapshot = await this.collection
      .where('isActive', '==', true)
      .count()
      .get();

    return snapshot.data().count;
  }

  async markAsInactive(id: string): Promise<Contexto | null> {
    return this.update(id, { isActive: false } as any);
  }

  async getRecentlyUpdated(limit: number = 5): Promise<Contexto[]> {
    const snapshot = await this.collection
      .where('isActive', '==', true)
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }

  async findPaginated(
    page: number = 1,
    limit: number = 20,
    filters?: {
      responsableId?: string;
      isActive?: boolean;
      tags?: string[];
    }
  ): Promise<{ data: Contexto[]; total: number; hasMore: boolean }> {
    let query: Query = this.collection;

    // Apply filters
    if (filters?.responsableId) {
      query = query.where('responsableId', '==', filters.responsableId);
    }

    if (filters?.isActive !== undefined) {
      query = query.where('isActive', '==', filters.isActive);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.where('tags', 'array-contains-any', filters.tags);
    }

    // Get total count
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // Apply pagination
    const offset = (page - 1) * limit;
    const dataQuery = query
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .offset(offset);

    const snapshot = await dataQuery.get();
    const data = snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);

    return {
      data,
      total,
      hasMore: offset + data.length < total,
    };
  }
}

export const contextosRepository = new ContextosRepository();