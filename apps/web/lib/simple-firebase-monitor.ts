import { firebaseDailyTracker } from './firebase-daily-tracker';

// Client-side only Firebase monitor
interface FirebaseCall {
  id: string;
  timestamp: number;
  collection?: string;
  operation: 'read' | 'write' | 'delete' | 'query';
  readCount: number;
  writeCount: number;
  duration: number;
  error?: string;
  indexUrl?: string;
  query?: any;
  result?: any;
}

interface FirebaseStats {
  totalReads: number;
  totalWrites: number;
  totalDeletes: number;
  totalCalls: number;
  errors: number;
  averageDuration: number;
  callsPerMinute: number;
}

class SimpleFirebaseMonitor {
  private calls: FirebaseCall[] = [];
  private isEnabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'development';
  private listeners: ((stats: FirebaseStats, calls: FirebaseCall[]) => void)[] = [];

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  trackCall(call: Omit<FirebaseCall, 'id' | 'timestamp'>): string {
    if (!this.isEnabled) return '';
    
    const firebaseCall: FirebaseCall = {
      ...call,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.calls.push(firebaseCall);
    
    // Keep only last 1000 calls to prevent memory issues
    if (this.calls.length > 1000) {
      this.calls = this.calls.slice(-1000);
    }

    // Track in daily accumulator (initial call tracking)
    if (call.operation === 'read' || call.operation === 'query') {
      firebaseDailyTracker.trackOperation('read', call.readCount || 0);
    } else if (call.operation === 'write') {
      firebaseDailyTracker.trackOperation('write', call.writeCount || 0);
    } else if (call.operation === 'delete') {
      firebaseDailyTracker.trackOperation('delete', call.writeCount || 0);
    }

    this.notifyListeners();
    return firebaseCall.id;
  }

  updateCall(id: string, updates: Partial<FirebaseCall>) {
    if (!this.isEnabled || !id) return;
    
    const callIndex = this.calls.findIndex(call => call.id === id);
    if (callIndex >= 0) {
      const oldCall = this.calls[callIndex];
      const newCall = { ...oldCall, ...updates };
      this.calls[callIndex] = newCall;
      
      // Update daily tracker with final counts (only count the difference)
      const readDiff = (updates.readCount || 0) - (oldCall.readCount || 0);
      const writeDiff = (updates.writeCount || 0) - (oldCall.writeCount || 0);
      
      if (readDiff > 0) {
        firebaseDailyTracker.trackOperation('read', readDiff);
      }
      if (writeDiff > 0) {
        firebaseDailyTracker.trackOperation('write', writeDiff);
      }
      
      // Track errors
      if (updates.error && !oldCall.error) {
        firebaseDailyTracker.trackOperation('error', 1);
      }
      
      this.notifyListeners();
    }
  }

  getStats(): FirebaseStats {
    if (!this.isEnabled) {
      return {
        totalReads: 0,
        totalWrites: 0,
        totalDeletes: 0,
        totalCalls: 0,
        errors: 0,
        averageDuration: 0,
        callsPerMinute: 0,
      };
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentCalls = this.calls.filter(call => call.timestamp > oneMinuteAgo);

    const totalReads = this.calls.reduce((sum, call) => sum + call.readCount, 0);
    const totalWrites = this.calls.reduce((sum, call) => sum + call.writeCount, 0);
    const totalDeletes = this.calls.filter(call => call.operation === 'delete').length;
    const errors = this.calls.filter(call => call.error).length;
    const totalDuration = this.calls.reduce((sum, call) => sum + call.duration, 0);

    return {
      totalReads,
      totalWrites,
      totalDeletes,
      totalCalls: this.calls.length,
      errors,
      averageDuration: this.calls.length > 0 ? totalDuration / this.calls.length : 0,
      callsPerMinute: recentCalls.length,
    };
  }

  getCalls(): FirebaseCall[] {
    if (!this.isEnabled) return [];
    return [...this.calls].reverse(); // Most recent first
  }

  clearStats() {
    this.calls = [];
    this.notifyListeners();
  }

  onStatsUpdate(callback: (stats: FirebaseStats, calls: FirebaseCall[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners() {
    if (!this.isEnabled) return;
    const stats = this.getStats();
    const calls = this.getCalls();
    this.listeners.forEach(listener => listener(stats, calls));
  }

  // Helper method to extract index creation URL from Firebase error
  extractIndexUrl(error: any): string | undefined {
    if (typeof error === 'string') {
      const match = error.match(/https:\/\/console\.firebase\.google\.com\/[^\s]+/);
      return match ? match[0] : undefined;
    }
    
    if (error?.message) {
      const match = error.message.match(/https:\/\/console\.firebase\.google\.com\/[^\s]+/);
      return match ? match[0] : undefined;
    }
    
    return undefined;
  }

  // Get daily usage tracker
  getDailyTracker() {
    return firebaseDailyTracker;
  }

  // Get today's accumulated usage
  getTodayUsage() {
    return firebaseDailyTracker.getTodayUsage();
  }

  // Get daily stats
  getDailyStats() {
    return firebaseDailyTracker.getDailyStats();
  }

  // API endpoints for server communication (future implementation)
  async syncWithServer() {
    if (typeof window === 'undefined') return;
    
    try {
      // Send today's usage to server
      const todayUsage = firebaseDailyTracker.getTodayUsage();
      const response = await fetch('/api/dev/firebase-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dailyUsage: todayUsage })
      });
      
      if (response.ok) {
        const serverStats = await response.json();
        console.log('Synced with server:', serverStats);
      }
    } catch (error) {
      // Ignore sync errors in development
    }
  }
}

export const simpleFirebaseMonitor = new SimpleFirebaseMonitor();
export type { FirebaseCall, FirebaseStats };