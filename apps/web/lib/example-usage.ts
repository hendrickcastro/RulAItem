// Example: How to use the Firebase monitoring system
import { useState, useEffect } from 'react';
import { simpleFirebaseMonitor } from './simple-firebase-monitor';

// Note: Import the monitored repository when it's available
// import { MonitoredUsersRepository } from '@kontexto/db/src/repositories/monitored-users';

// Example 1: Using the monitored repository
export async function exampleUsage() {
  // const usersRepo = new MonitoredUsersRepository();
  
  try {
    // This call will be automatically monitored
    // const user = await usersRepo.findByEmail('user@example.com');
    
    // if (user) {
    //   // Update operation is also monitored
    //   await usersRepo.update(user.id, {
    //     name: 'Updated Name'
    //   });
    // }
    console.log('Example usage - repository operations would be monitored automatically');
  } catch (error) {
    // Errors are automatically captured with index URLs if available
    console.error('User operation failed:', error);
  }
}

// Example 2: Manual monitoring for custom operations
export async function customFirebaseOperation() {
  const startTime = Date.now();
  const callId = simpleFirebaseMonitor.trackCall({
    collection: 'custom_collection',
    operation: 'query',
    readCount: 0,
    writeCount: 0,
    duration: 0,
    query: { customQuery: true }
  });

  try {
    // Your custom Firebase operation here
    // const result = await db.collection('custom_collection').get();
    const result = { size: 10 }; // Mock result
    
    const duration = Date.now() - startTime;
    
    simpleFirebaseMonitor.updateCall(callId, {
      duration,
      readCount: result.size,
      writeCount: 0,
    });
    
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const indexUrl = simpleFirebaseMonitor.extractIndexUrl(error);
    
    simpleFirebaseMonitor.updateCall(callId, {
      duration,
      error: error.message,
      indexUrl,
      readCount: 0,
      writeCount: 0,
    });
    
    throw error;
  }
}

// Example 3: Query optimization patterns
export async function optimizedQueries() {
  // const usersRepo = new MonitoredUsersRepository();
  
  // ❌ Bad: This could read many documents
  // const allUsers = await usersRepo.findAll(1000);
  
  // ✅ Good: Limit and use specific criteria
  // const activeUsers = await usersRepo.findActive(20);
  
  // ✅ Good: Use specific lookups when possible
  // const specificUser = await usersRepo.findByGithubId('github123');
  
  console.log('Optimized query patterns - use specific criteria and limits');
  return { message: 'Query optimization examples' };
}

// Example 4: Batch operations to reduce reads
export async function batchOperations() {
  // This is just an example - implement actual batch logic in your repositories
  const userIds = ['user1', 'user2', 'user3'];
  // const usersRepo = new MonitoredUsersRepository();
  
  // ❌ Bad: Multiple individual reads
  // const users = await Promise.all(
  //   userIds.map(id => usersRepo.findById(id))
  // );
  
  // ✅ Good: Would need to implement batch read method
  // const users = await usersRepo.findByIds(userIds);
  
  console.log('Batch operations should be implemented in repositories');
}

// Example 5: Error handling with index creation
export async function handleIndexErrors() {
  // const usersRepo = new MonitoredUsersRepository();
  
  try {
    // This might require a composite index
    // await db.collection('users')
    //   .where('active', '==', true)
    //   .where('role', '==', 'admin')
    //   .orderBy('createdAt', 'desc')
    //   .get();
  } catch (error: any) {
    // The monitor will extract the index URL automatically
    const indexUrl = simpleFirebaseMonitor.extractIndexUrl(error);
    
    if (indexUrl) {
      console.log('Create missing index at:', indexUrl);
      // In development, this URL will be shown in the dev support tab
    }
    
    throw error;
  }
}

// Example 6: Performance monitoring hooks
export function useFirebaseStats() {
  const [stats, setStats] = useState(simpleFirebaseMonitor.getStats());
  
  useEffect(() => {
    const unsubscribe = simpleFirebaseMonitor.onStatsUpdate((newStats) => {
      setStats(newStats);
      
      // Alert if approaching limits
      if (newStats.totalReads > 45000) {
        console.warn('⚠️ Firebase reads approaching daily limit!', newStats.totalReads);
      }
      
      if (newStats.callsPerMinute > 50) {
        console.warn('⚠️ High Firebase call rate:', newStats.callsPerMinute, 'calls/minute');
      }
    });
    
    return unsubscribe;
  }, []);
  
  return stats;
}

// You can import these in your components like:
// import { useFirebaseStats } from '@/lib/example-usage';