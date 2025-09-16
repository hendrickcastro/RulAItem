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

class FirebaseMonitor {
  private calls: FirebaseCall[] = [];
  private isEnabled = process.env.NODE_ENV === 'development';
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

    this.notifyListeners();
    return firebaseCall.id;
  }

  updateCall(id: string, updates: Partial<FirebaseCall>) {
    if (!this.isEnabled || !id) return;
    
    const callIndex = this.calls.findIndex(call => call.id === id);
    if (callIndex >= 0) {
      this.calls[callIndex] = { ...this.calls[callIndex], ...updates };
      this.notifyListeners();
    }
  }

  getStats(): FirebaseStats {
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
}

export const firebaseMonitor = new FirebaseMonitor();
export type { FirebaseCall, FirebaseStats };