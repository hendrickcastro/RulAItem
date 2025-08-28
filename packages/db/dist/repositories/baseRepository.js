"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const client_1 = require("../client");
class BaseRepository {
    constructor(collectionName, schema) {
        this.collection = (0, client_1.getDb)().collection(collectionName);
        this.schema = schema;
    }
    async create(data) {
        const now = new Date();
        const docData = {
            ...data,
            createdAt: now,
            updatedAt: now
        };
        const docRef = await this.collection.add(docData);
        const created = { ...docData, id: docRef.id };
        return this.schema.parse(created);
    }
    async findById(id) {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists)
            return null;
        const data = { id: doc.id, ...doc.data() };
        return this.schema.parse(data);
    }
    async update(id, data) {
        const updateData = {
            ...data,
            updatedAt: new Date()
        };
        await this.collection.doc(id).update(updateData);
        const updated = await this.findById(id);
        if (!updated)
            throw new Error('Document not found after update');
        return updated;
    }
    async delete(id) {
        await this.collection.doc(id).delete();
    }
    async findAll(limit = 50) {
        const snapshot = await this.collection.limit(limit).get();
        return snapshot.docs.map(doc => {
            const data = { id: doc.id, ...doc.data() };
            return this.schema.parse(data);
        });
    }
    async findWhere(field, operator, value, limit = 50) {
        const snapshot = await this.collection
            .where(field, operator, value)
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => {
            const data = { id: doc.id, ...doc.data() };
            return this.schema.parse(data);
        });
    }
    async count() {
        const snapshot = await this.collection.count().get();
        return snapshot.data().count;
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=baseRepository.js.map