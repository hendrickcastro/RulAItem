// Demo data and functions for Firebase monitor
import { simpleFirebaseMonitor } from './simple-firebase-monitor';

export function addDemoFirebaseData() {
  if (process.env.NODE_ENV !== 'development') return;

  // Simulate some Firebase calls
  const demoOperations = [
    {
      collection: 'users',
      operation: 'query' as const,
      readCount: 15,
      writeCount: 0,
      duration: 245,
    },
    {
      collection: 'contextos',
      operation: 'read' as const,
      readCount: 1,
      writeCount: 0,
      duration: 120,
    },
    {
      collection: 'commits',
      operation: 'query' as const,
      readCount: 50,
      writeCount: 0,
      duration: 890,
    },
    {
      collection: 'users',
      operation: 'write' as const,
      readCount: 0,
      writeCount: 1,
      duration: 180,
    },
    {
      collection: 'analysis',
      operation: 'query' as const,
      readCount: 125,
      writeCount: 0,
      duration: 1240,
      error: 'The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/agtxia-rulaitem/firestore/indexes?create_composite=Cl...',
    },
    {
      collection: 'jobs',
      operation: 'query' as const,
      readCount: 8,
      writeCount: 0,
      duration: 156,
    },
    {
      collection: 'contextos',
      operation: 'delete' as const,
      readCount: 0,
      writeCount: 1,
      duration: 95,
    },
  ];

  // Add demo data with timestamps spread out
  demoOperations.forEach((operation, index) => {
    setTimeout(() => {
      const callId = simpleFirebaseMonitor.trackCall({
        collection: operation.collection,
        operation: operation.operation,
        readCount: 0,
        writeCount: 0,
        duration: 0,
        query: { demo: true, operation: operation.operation },
      });

      // Simulate completion
      setTimeout(() => {
        simpleFirebaseMonitor.updateCall(callId, {
          duration: operation.duration,
          readCount: operation.readCount,
          writeCount: operation.writeCount,
          error: operation.error,
          indexUrl: operation.error ? simpleFirebaseMonitor.extractIndexUrl(operation.error) : undefined,
        });
      }, Math.random() * 100); // Random completion delay
    }, index * 200); // Spread out the calls
  });

  console.log('🔧 Added demo Firebase monitoring data');
}

// Function to simulate ongoing Firebase activity
export function startFirebaseDemo() {
  if (process.env.NODE_ENV !== 'development') return;

  // Add initial demo data
  addDemoFirebaseData();

  // Simulate periodic Firebase activity
  const demoInterval = setInterval(() => {
    const operations = ['read', 'query', 'write'];
    const collections = ['users', 'contextos', 'commits', 'analysis', 'jobs'];
    const operation = operations[Math.floor(Math.random() * operations.length)] as 'read' | 'query' | 'write';
    const collection = collections[Math.floor(Math.random() * collections.length)];
    
    const callId = simpleFirebaseMonitor.trackCall({
      collection,
      operation,
      readCount: 0,
      writeCount: 0,
      duration: 0,
      query: { demo: true, random: true },
    });

    // Simulate completion
    setTimeout(() => {
      const readCount = operation === 'query' ? Math.floor(Math.random() * 20) + 1 : 
                      operation === 'read' ? 1 : 0;
      const writeCount = operation === 'write' ? 1 : 0;
      const duration = Math.floor(Math.random() * 500) + 50;
      
      // Occasionally add errors
      const hasError = Math.random() < 0.1; // 10% chance
      const error = hasError ? `Index required for ${collection} collection` : undefined;
      
      simpleFirebaseMonitor.updateCall(callId, {
        duration,
        readCount,
        writeCount,
        error,
        indexUrl: hasError ? `https://console.firebase.google.com/project/demo/${collection}` : undefined,
      });
    }, Math.random() * 200);
  }, 3000); // Every 3 seconds

  // Stop demo after 2 minutes
  setTimeout(() => {
    clearInterval(demoInterval);
    console.log('🔧 Firebase demo stopped');
  }, 120000);

  return () => clearInterval(demoInterval);
}

// Initialize demo when in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Start demo after a short delay
  setTimeout(startFirebaseDemo, 2000);
}