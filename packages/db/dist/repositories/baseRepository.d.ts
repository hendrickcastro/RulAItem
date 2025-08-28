import { CollectionReference, DocumentData } from 'firebase-admin/firestore';
import { z } from 'zod';
export declare abstract class BaseRepository<T extends {
    id: string;
}> {
    protected collection: CollectionReference<DocumentData>;
    protected schema: z.ZodSchema<T>;
    constructor(collectionName: string, schema: z.ZodSchema<T>);
    create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
    findById(id: string): Promise<T | null>;
    update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T>;
    delete(id: string): Promise<void>;
    findAll(limit?: number): Promise<T[]>;
    findWhere(field: string, operator: any, value: any, limit?: number): Promise<T[]>;
    count(): Promise<number>;
}
//# sourceMappingURL=baseRepository.d.ts.map