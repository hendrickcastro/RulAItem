// Firebase Daily Usage Tracker
interface DailyUsage {
  date: string; // YYYY-MM-DD format
  reads: number;
  writes: number;
  deletes: number;
  errors: number;
  lastUpdated: number; // timestamp
}

interface DailyStats {
  today: DailyUsage;
  yesterday: DailyUsage;
  thisWeek: DailyUsage[];
  thisMonth: DailyUsage[];
  totalThisMonth: {
    reads: number;
    writes: number;
    deletes: number;
    errors: number;
  };
}

class FirebaseDailyTracker {
  private readonly STORAGE_KEY = 'firebase_daily_usage';
  private readonly MAX_HISTORY_DAYS = 30;
  
  private getToday(): string {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private getYesterday(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  private getDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  private loadFromStorage(): DailyUsage[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const data = JSON.parse(stored);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn('Failed to load Firebase usage data from localStorage:', error);
      return [];
    }
  }

  private saveToStorage(data: DailyUsage[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Keep only last 30 days of data
      const cutoffDate = this.getDaysAgo(this.MAX_HISTORY_DAYS);
      const filteredData = data.filter(day => day.date >= cutoffDate);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredData));
    } catch (error) {
      console.warn('Failed to save Firebase usage data to localStorage:', error);
    }
  }

  private findOrCreateDayUsage(date: string, usageData: DailyUsage[]): DailyUsage {
    let dayUsage = usageData.find(day => day.date === date);
    
    if (!dayUsage) {
      dayUsage = {
        date,
        reads: 0,
        writes: 0,
        deletes: 0,
        errors: 0,
        lastUpdated: Date.now()
      };
      usageData.push(dayUsage);
    }
    
    return dayUsage;
  }

  // Track a new Firebase operation
  trackOperation(operation: 'read' | 'write' | 'delete' | 'error', count: number = 1): void {
    if (typeof window === 'undefined') return;
    
    const today = this.getToday();
    const usageData = this.loadFromStorage();
    const todayUsage = this.findOrCreateDayUsage(today, usageData);
    
    // Update the appropriate counter
    switch (operation) {
      case 'read':
        todayUsage.reads += count;
        break;
      case 'write':
        todayUsage.writes += count;
        break;
      case 'delete':
        todayUsage.deletes += count;
        break;
      case 'error':
        todayUsage.errors += count;
        break;
    }
    
    todayUsage.lastUpdated = Date.now();
    
    // Save back to storage
    this.saveToStorage(usageData);
    
    // Log warnings for high usage
    this.checkUsageLimits(todayUsage);
  }

  private checkUsageLimits(todayUsage: DailyUsage): void {
    const { reads, writes } = todayUsage;
    
    // Firebase Spark plan limits (adjust as needed)
    const DAILY_READ_LIMIT = 50000;
    const DAILY_WRITE_LIMIT = 20000;
    
    // Read warnings
    if (reads >= DAILY_READ_LIMIT * 0.9) {
      console.warn(`🚨 Firebase reads near daily limit: ${reads}/${DAILY_READ_LIMIT}`);
    } else if (reads >= DAILY_READ_LIMIT * 0.8) {
      console.warn(`⚠️ Firebase reads at 80% of daily limit: ${reads}/${DAILY_READ_LIMIT}`);
    } else if (reads >= DAILY_READ_LIMIT * 0.6) {
      console.info(`📊 Firebase reads at 60% of daily limit: ${reads}/${DAILY_READ_LIMIT}`);
    }
    
    // Write warnings
    if (writes >= DAILY_WRITE_LIMIT * 0.9) {
      console.warn(`🚨 Firebase writes near daily limit: ${writes}/${DAILY_WRITE_LIMIT}`);
    }
  }

  // Get today's usage
  getTodayUsage(): DailyUsage {
    const today = this.getToday();
    const usageData = this.loadFromStorage();
    return this.findOrCreateDayUsage(today, usageData);
  }

  // Get yesterday's usage
  getYesterdayUsage(): DailyUsage {
    const yesterday = this.getYesterday();
    const usageData = this.loadFromStorage();
    return this.findOrCreateDayUsage(yesterday, usageData);
  }

  // Get usage for a specific date
  getUsageForDate(date: string): DailyUsage | null {
    const usageData = this.loadFromStorage();
    return usageData.find(day => day.date === date) || null;
  }

  // Get usage for the last N days
  getUsageForDays(days: number): DailyUsage[] {
    const usageData = this.loadFromStorage();
    const startDate = this.getDaysAgo(days - 1);
    
    return usageData
      .filter(day => day.date >= startDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Get this week's usage (Monday to Sunday)
  getThisWeekUsage(): DailyUsage[] {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1); // Handle Sunday as 0
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }
    
    const usageData = this.loadFromStorage();
    return weekDates.map(date => 
      this.findOrCreateDayUsage(date, usageData)
    );
  }

  // Get this month's usage
  getThisMonthUsage(): DailyUsage[] {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startDate = firstDayOfMonth.toISOString().split('T')[0];
    
    const usageData = this.loadFromStorage();
    return usageData
      .filter(day => day.date >= startDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Get comprehensive daily stats
  getDailyStats(): DailyStats {
    const today = this.getTodayUsage();
    const yesterday = this.getYesterdayUsage();
    const thisWeek = this.getThisWeekUsage();
    const thisMonth = this.getThisMonthUsage();
    
    // Calculate monthly totals
    const totalThisMonth = thisMonth.reduce(
      (total, day) => ({
        reads: total.reads + day.reads,
        writes: total.writes + day.writes,
        deletes: total.deletes + day.deletes,
        errors: total.errors + day.errors,
      }),
      { reads: 0, writes: 0, deletes: 0, errors: 0 }
    );
    
    return {
      today,
      yesterday,
      thisWeek,
      thisMonth,
      totalThisMonth
    };
  }

  // Reset today's counters (useful for testing)
  resetToday(): void {
    const today = this.getToday();
    const usageData = this.loadFromStorage();
    const todayIndex = usageData.findIndex(day => day.date === today);
    
    if (todayIndex >= 0) {
      usageData[todayIndex] = {
        date: today,
        reads: 0,
        writes: 0,
        deletes: 0,
        errors: 0,
        lastUpdated: Date.now()
      };
      this.saveToStorage(usageData);
    }
  }

  // Clear all stored data (useful for testing)
  clearAllData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  // Export data for backup
  exportData(): string {
    const usageData = this.loadFromStorage();
    return JSON.stringify(usageData, null, 2);
  }

  // Import data from backup
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data)) {
        this.saveToStorage(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import Firebase usage data:', error);
      return false;
    }
  }
}

// Create singleton instance
export const firebaseDailyTracker = new FirebaseDailyTracker();
export type { DailyUsage, DailyStats };