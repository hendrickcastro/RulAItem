import { WebhookEvent, WebhookEventSchema } from '@kontexto/core';
import { BaseRepository } from './base';

export class WebhooksRepository extends BaseRepository<WebhookEvent> {
  constructor() {
    super('webhook_events', WebhookEventSchema);
  }

  async findBySource(source: string, limit: number = 20): Promise<WebhookEvent[]> {
    const snapshot = await this.collection
      .where('source', '==', source)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }

  async findUnprocessed(limit: number = 50): Promise<WebhookEvent[]> {
    const snapshot = await this.collection
      .where('processed', '==', false)
      .orderBy('createdAt', 'asc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }

  async markAsProcessed(eventId: string): Promise<WebhookEvent | null> {
    return this.update(eventId, {
      processed: true,
    } as any);
  }

  async findByEvent(event: string, limit: number = 20): Promise<WebhookEvent[]> {
    const snapshot = await this.collection
      .where('event', '==', event)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }

  async getEventStats(): Promise<{
    total: number;
    processed: number;
    pending: number;
    bySource: Record<string, number>;
    byEvent: Record<string, number>;
  }> {
    const snapshot = await this.collection.get();
    const events = snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);

    const bySource: Record<string, number> = {};
    const byEvent: Record<string, number> = {};

    events.forEach(event => {
      bySource[event.source] = (bySource[event.source] || 0) + 1;
      byEvent[event.event] = (byEvent[event.event] || 0) + 1;
    });

    return {
      total: events.length,
      processed: events.filter(e => e.processed).length,
      pending: events.filter(e => !e.processed).length,
      bySource,
      byEvent,
    };
  }

  async cleanupOldEvents(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const snapshot = await this.collection
      .where('processed', '==', true)
      .where('createdAt', '<', cutoffDate)
      .get();

    const batch = this.collection.firestore.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    return snapshot.docs.length;
  }

  async getRecentEvents(limit: number = 20): Promise<WebhookEvent[]> {
    const snapshot = await this.collection
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }

  async findDuplicates(
    source: string,
    event: string,
    payloadHash: string,
    withinMinutes: number = 5
  ): Promise<WebhookEvent[]> {
    const since = new Date(Date.now() - withinMinutes * 60 * 1000);

    // This is a simplified check - in production, you might want to hash payloads
    const snapshot = await this.collection
      .where('source', '==', source)
      .where('event', '==', event)
      .where('createdAt', '>=', since)
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }
}

export const webhooksRepository = new WebhooksRepository();