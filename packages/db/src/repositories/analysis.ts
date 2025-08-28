import { Analysis, AnalysisSchema } from '@kontexto/core';
import { BaseRepository } from './base';

export class AnalysisRepository extends BaseRepository<Analysis> {
  constructor() {
    super('analysis', AnalysisSchema);
  }

  async findByCommitId(commitId: string): Promise<Analysis | null> {
    const snapshot = await this.collection
      .where('commitId', '==', commitId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.deserializeData(snapshot.docs[0]);
  }

  async findByContexto(contextoId: string, limit: number = 20): Promise<Analysis[]> {
    // First, get commits for this contexto, then find their analyses
    // This is a simplification - in production, you might denormalize this
    const commitsSnapshot = await this.collection.firestore
      .collection('commits')
      .where('contextoId', '==', contextoId)
      .select('id')
      .get();

    if (commitsSnapshot.empty) return [];

    const commitIds = commitsSnapshot.docs.map(doc => doc.id);
    
    // Firestore 'in' queries are limited to 10 items
    const analysisPromises: Promise<Analysis[]>[] = [];
    
    for (let i = 0; i < commitIds.length; i += 10) {
      const batch = commitIds.slice(i, i + 10);
      const promise = this.collection
        .where('commitId', 'in', batch)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => 
          snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean)
        );
      analysisPromises.push(promise);
    }

    const analysisArrays = await Promise.all(analysisPromises);
    const allAnalysis = analysisArrays.flat();
    
    // Sort by creation date and limit
    return allAnalysis
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getQualityStats(contextoId: string): Promise<{
    averageQuality: number;
    qualityTrend: 'improving' | 'declining' | 'stable';
    highImpactCount: number;
    complexCount: number;
  }> {
    const analyses = await this.findByContexto(contextoId, 100);
    
    if (analyses.length === 0) {
      return {
        averageQuality: 0,
        qualityTrend: 'stable',
        highImpactCount: 0,
        complexCount: 0,
      };
    }

    const averageQuality = analyses.reduce((sum, a) => sum + a.codeQuality, 0) / analyses.length;
    const highImpactCount = analyses.filter(a => a.impact === 'high').length;
    const complexCount = analyses.filter(a => a.complexity === 'complex').length;

    // Calculate trend (compare first and last half)
    let qualityTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (analyses.length >= 6) {
      const halfPoint = Math.floor(analyses.length / 2);
      const recentAvg = analyses.slice(0, halfPoint).reduce((sum, a) => sum + a.codeQuality, 0) / halfPoint;
      const olderAvg = analyses.slice(halfPoint).reduce((sum, a) => sum + a.codeQuality, 0) / (analyses.length - halfPoint);
      
      if (recentAvg > olderAvg + 0.5) {
        qualityTrend = 'improving';
      } else if (recentAvg < olderAvg - 0.5) {
        qualityTrend = 'declining';
      }
    }

    return {
      averageQuality: Math.round(averageQuality * 10) / 10,
      qualityTrend,
      highImpactCount,
      complexCount,
    };
  }

  async searchByPattern(pattern: string, limit: number = 10): Promise<Analysis[]> {
    const snapshot = await this.collection
      .where('patterns', 'array-contains', pattern)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);
  }

  async getImpactDistribution(): Promise<Record<'low' | 'medium' | 'high', number>> {
    const snapshot = await this.collection.get();
    const analyses = snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);

    return {
      low: analyses.filter(a => a.impact === 'low').length,
      medium: analyses.filter(a => a.impact === 'medium').length,
      high: analyses.filter(a => a.impact === 'high').length,
    };
  }

  async getComplexityDistribution(): Promise<Record<'simple' | 'moderate' | 'complex', number>> {
    const snapshot = await this.collection.get();
    const analyses = snapshot.docs.map(doc => this.deserializeData(doc)!).filter(Boolean);

    return {
      simple: analyses.filter(a => a.complexity === 'simple').length,
      moderate: analyses.filter(a => a.complexity === 'moderate').length,
      complex: analyses.filter(a => a.complexity === 'complex').length,
    };
  }
}

export const analysisRepository = new AnalysisRepository();