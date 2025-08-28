import { CollectionReference, DocumentData, Query } from 'firebase-admin/firestore';
import { getDb } from '../client';
import { z } from 'zod';

export abstract class BaseRepository<T extends { id: string }> {
  protected collection: CollectionReference<DocumentData>;
  protected schema: z.ZodSchema<T>;

  constructor(collectionName: string, schema: z.ZodSchema<T>) {
    this.collection = getDb().collection(collectionName);
    this.schema = schema;
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date();
    const docData = {
      ...data,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await this.collection.add(docData);
    const created = { ...docData, id: docRef.id } as T;
    
    return this.schema.parse(created);
  }

  async findById(id: string): Promise<T | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    
    const data = { id: doc.id, ...doc.data() } as T;
    return this.schema.parse(data);
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T> {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    await this.collection.doc(id).update(updateData);
    const updated = await this.findById(id);
    
    if (!updated) throw new Error('Document not found after update');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  async findAll(limit = 50): Promise<T[]> {
    const snapshot = await this.collection.limit(limit).get();
    return snapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() } as T;
      return this.schema.parse(data);
    });
  }

  async findWhere(field: string, operator: any, value: any, limit = 50): Promise<T[]> {
    const snapshot = await this.collection
      .where(field, operator, value)
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() } as T;
      return this.schema.parse(data);
    });
  }

  async count(): Promise<number> {
    const snapshot = await this.collection.count().get();
    return snapshot.data().count;
  }
}
