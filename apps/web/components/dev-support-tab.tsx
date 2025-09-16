'use client';

import { useState, useEffect } from 'react';
import { simpleFirebaseMonitor, FirebaseStats, FirebaseCall } from '@/lib/simple-firebase-monitor';
// Simple card component for the dev tab
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-4 py-3 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-sm font-medium text-gray-900 ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-4 py-3 ${className}`}>
    {children}
  </div>
);

interface DevSupportTabProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function DevSupportTab({ isVisible, onToggle }: DevSupportTabProps) {
  const [stats, setStats] = useState<FirebaseStats>({
    totalReads: 0,
    totalWrites: 0,
    totalDeletes: 0,
    totalCalls: 0,
    errors: 0,
    averageDuration: 0,
    callsPerMinute: 0,
  });
  const [calls, setCalls] = useState<FirebaseCall[]>([]);
  const [filter, setFilter] = useState<'all' | 'errors' | 'slow'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const updateStats = (newStats: FirebaseStats, newCalls: FirebaseCall[]) => {
      setStats(newStats);
      setCalls(newCalls);
    };

    // Initial load
    updateStats(simpleFirebaseMonitor.getStats(), simpleFirebaseMonitor.getCalls());

    // Subscribe to updates
    const unsubscribe = simpleFirebaseMonitor.onStatsUpdate(updateStats);
    
    // Refresh every 5 seconds
    const interval = setInterval(() => {
      updateStats(simpleFirebaseMonitor.getStats(), simpleFirebaseMonitor.getCalls());
      // Try to sync with server occasionally
      simpleFirebaseMonitor.syncWithServer();
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const filteredCalls = calls.filter(call => {
    // Apply filter
    if (filter === 'errors' && !call.error) return false;
    if (filter === 'slow' && call.duration < 1000) return false;

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        call.collection?.toLowerCase().includes(searchLower) ||
        call.operation.toLowerCase().includes(searchLower) ||
        call.error?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'read': return 'text-blue-600';
      case 'write': return 'text-green-600';
      case 'delete': return 'text-red-600';
      case 'query': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const handleClearStats = () => {
    simpleFirebaseMonitor.clearStats();
    setStats({
      totalReads: 0,
      totalWrites: 0,
      totalDeletes: 0,
      totalCalls: 0,
      errors: 0,
      averageDuration: 0,
      callsPerMinute: 0,
    });
    setCalls([]);
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`fixed bottom-4 right-4 z-50 px-4 py-2 text-white rounded-lg shadow-lg transition-all duration-200 ${
          isVisible ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isVisible ? '✕ Cerrar' : '🔧 Dev Support'}
      </button>

      {/* Support Panel */}
      {isVisible && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-end">
          <div className="bg-white w-full h-5/6 rounded-t-lg shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 text-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Development Support - Firebase Monitor</h2>
                <button
                  onClick={onToggle}
                  className="text-gray-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Reads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${stats.totalReads > 45000 ? 'text-red-600' : stats.totalReads > 30000 ? 'text-orange-600' : 'text-green-600'}`}>
                      {stats.totalReads.toLocaleString()}
                    </div>
                    {stats.totalReads > 45000 && (
                      <div className="text-xs text-red-600 mt-1">⚠️ Cerca del límite!</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Writes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {stats.totalWrites.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${stats.errors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.errors}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Avg Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatDuration(stats.averageDuration)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Calls/Min</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.callsPerMinute}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Calls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-600">
                      {stats.totalCalls}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <button
                      onClick={handleClearStats}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      Clear Stats
                    </button>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex gap-4 items-center">
                <div className="flex gap-2">
                  {(['all', 'errors', 'slow'] as const).map((filterType) => (
                    <button
                      key={filterType}
                      onClick={() => setFilter(filterType)}
                      className={`px-3 py-1 rounded text-sm ${
                        filter === filterType 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {filterType === 'all' ? 'All' : filterType === 'errors' ? 'Errors' : 'Slow (>1s)'}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Search calls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            {/* Calls List */}
            <div className="flex-1 overflow-auto">
              <div className="p-4">
                <div className="space-y-2">
                  {filteredCalls.map((call) => (
                    <div
                      key={call.id}
                      className={`p-3 rounded-lg border ${
                        call.error ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className={`font-medium ${getOperationColor(call.operation)}`}>
                              {call.operation.toUpperCase()}
                            </span>
                            <span className="text-gray-600">{call.collection}</span>
                            <span className="text-gray-400">{formatTimestamp(call.timestamp)}</span>
                          </div>
                          
                          {call.error && (
                            <div className="mt-2 text-sm">
                              <div className="text-red-700 font-medium">Error:</div>
                              <div className="text-red-600 bg-red-100 p-2 rounded mt-1 font-mono text-xs">
                                {call.error}
                              </div>
                              {call.indexUrl && (
                                <div className="mt-2">
                                  <a
                                    href={call.indexUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                                  >
                                    🔗 Create missing index in Firebase Console
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                          {call.query && (
                            <details className="mt-2">
                              <summary className="text-sm text-gray-600 cursor-pointer">Query details</summary>
                              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(call.query, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {call.readCount > 0 && (
                            <span className="text-blue-600">📖 {call.readCount}</span>
                          )}
                          {call.writeCount > 0 && (
                            <span className="text-green-600">✏️ {call.writeCount}</span>
                          )}
                          <span className={`${call.duration > 1000 ? 'text-red-600 font-bold' : ''}`}>
                            ⏱️ {formatDuration(call.duration)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredCalls.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No calls match the current filter
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}