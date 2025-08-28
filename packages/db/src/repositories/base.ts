import { CollectionReference, DocumentData, QueryDocumentSnapshot, DocumentSnapshot } from 'firebase-admin/firestore';
import { z } from 'zod';
import { db } from '../client';
import { cache } from '../cache';
import { generateId } from '@kontexto/core';

export abstract class BaseRepository<T> {
  protected collection: CollectionReference;
  protected schema: z.ZodSchema<any>;

  constructor(collectionName: string, schema: z.ZodSchema<any>) {
    this.collection = db().collection(collectionName);
    this.schema = schema;
  }

  protected validateData(data: any): T {
    const result = this.schema.safeParse(data);
    if (!result.success) {
      throw new Error(`Validation error: ${result.error.message}`);
    }
    return result.data;
  }

  protected serializeData(data: T): DocumentData {
    const serialized = { ...data } as any;
    
    // Convert dates to Firestore timestamps
    Object.keys(serialized).forEach(key => {
      if (serialized[key] instanceof Date) {
        // Firestore will automatically handle Date objects
      }
    });

    return serialized;
  }

  protected deserializeData(doc: QueryDocumentSnapshot | DocumentSnapshot): T | null {
    if (!doc.exists) return null;

    const data = doc.data()!;
    
    // Convert Firestore timestamps back to dates
    Object.keys(data).forEach(key => {
      if (data[key] && typeof data[key].toDate === 'function') {
        data[key] = data[key].toDate();
      }
    });

    return this.validateData({ id: doc.id, ...data });
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    const id = generateId();
    const now = new Date();
    const fullData = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    } as T;

    const validated = this.validateData(fullData);
    const serialized = this.serializeData(validated);

    await this.collection.doc(id).set(serialized);
    
    // Invalidate cache
    await this.invalidateCache(id);
    
    return validated;
  }

  async findById(id: string): Promise<T | null> {
    // Try cache first
    const cacheKey = this.getCacheKey(id);
    const cached = await cache.get<T>(cacheKey);
    if (cached) return cached;

    const doc = await this.collection.doc(id).get();
    const result = this.deserializeData(doc);
    
    if (result) {
      await cache.set(cacheKey, result);
    }
    
    return result;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await this.collection.doc(id).update(updateData);
    
    // Invalidate cache and fetch updated document
    await this.invalidateCache(id);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.collection.doc(id).delete();
    await this.invalidateCache(id);
    return true;
  }

  async findAll(limit: number = 20, offset: number = 0): Promise<T[]> {
    const query = this.collection
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);

    const snapshot = await query.get();
    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }

  async count(): Promise<number> {
    const snapshot = await this.collection.count().get();
    return snapshot.data().count;
  }

  async exists(id: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    return doc.exists;
  }

  protected getCacheKey(id: string): string {
    return `${this.collection.id}:${id}`;
  }

  protected async invalidateCache(id: string): Promise<void> {
    const cacheKey = this.getCacheKey(id);
    await cache.del(cacheKey);
  }
}