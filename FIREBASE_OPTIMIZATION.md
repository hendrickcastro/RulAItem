# Firebase Optimization Guide

## Current Issues and Recommendations

### 1. Query Optimization Problems Detected

Based on the monitoring system, these are the most common inefficiencies:

#### High Read Count Operations

**Problem**: Some queries are reading more documents than necessary
- `findAll()` operations without proper filtering
- Missing composite indexes for complex queries
- Overuse of `offset()` for pagination

**Solutions**:
```typescript
// ❌ Bad - Reads all documents then filters in memory
const allUsers = await collection.get();
const activeUsers = allUsers.docs.filter(doc => doc.data().active);

// ✅ Good - Filter at database level
const activeUsers = await collection
  .where('active', '==', true)
  .limit(20)
  .get();
```

#### Inefficient Pagination

**Problem**: Using `offset()` for pagination is expensive and slow
```typescript
// ❌ Bad - Expensive for large offsets
.offset(1000)
.limit(20)
```

**Solution**: Use cursor-based pagination
```typescript
// ✅ Good - Use cursor pagination
let lastDoc = null;
const firstPage = await collection
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get();

lastDoc = firstPage.docs[firstPage.docs.length - 1];

// Next page
const nextPage = await collection
  .orderBy('createdAt', 'desc')
  .startAfter(lastDoc)
  .limit(20)
  .get();
```

### 2. Missing Indexes

The monitoring system will show index creation URLs when queries fail. Common missing indexes:

1. **Composite indexes for multi-field queries**
2. **Array-contains queries with other filters**
3. **Inequality filters with orderBy on different fields**

### 3. Optimized Repository Patterns

#### Before (Inefficient):
```typescript
// Multiple reads for related data
async getContextWithCommits(contextId: string) {
  const context = await this.contextoRepository.findById(contextId);
  const commits = await this.commitRepository.findByContextId(contextId);
  const analysis = await this.analysisRepository.findByContextId(contextId);
  // 3 separate reads + potential subcollection reads
}
```

#### After (Optimized):
```typescript
// Batch reads and subcollections
async getContextWithCommits(contextId: string) {
  const batch = db.batch();
  
  // Use subcollections for related data
  const contextRef = db.collection('contextos').doc(contextId);
  const commitsRef = contextRef.collection('commits').limit(50);
  
  const [contextSnap, commitsSnap] = await Promise.all([
    contextRef.get(),
    commitsRef.get()
  ]);
  
  // 2 reads total instead of multiple
}
```

### 4. Caching Strategy

#### Current Issues:
- No cache invalidation strategy for related documents
- Cache not being used effectively for frequently accessed data

#### Recommendations:
```typescript
// Implement smart cache invalidation
class OptimizedRepository extends MonitoredBaseRepository<T> {
  private getCacheKeys(id: string): string[] {
    return [
      `${this.collectionName}:${id}`,
      `${this.collectionName}:list`,
      `${this.collectionName}:count`
    ];
  }

  async invalidateRelatedCache(id: string, relatedCollections: string[] = []) {
    const keys = this.getCacheKeys(id);
    
    // Invalidate related collection caches
    for (const collection of relatedCollections) {
      keys.push(`${collection}:list`);
    }
    
    await Promise.all(keys.map(key => cache.del(key)));
  }
}
```

### 5. Query Patterns to Avoid

#### 1. N+1 Query Problem
```typescript
// ❌ Bad - N+1 queries
const contextos = await contextRepository.findAll();
for (const contexto of contextos) {
  const commits = await commitRepository.findByContextId(contexto.id); // N queries
}

// ✅ Good - Batch query
const contextIds = contextos.map(c => c.id);
const allCommits = await commitRepository.findByContextIds(contextIds); // 1 query
```

#### 2. Unnecessary Count Queries
```typescript
// ❌ Bad - Separate count query
const count = await collection.count().get();
const docs = await collection.limit(20).get();

// ✅ Good - Use snapshot metadata
const snapshot = await collection.limit(21).get(); // Get one extra
const hasMore = snapshot.docs.length === 21;
const docs = hasMore ? snapshot.docs.slice(0, 20) : snapshot.docs;
```

### 6. Monitoring Integration

The dev support tab will help identify:

1. **Slow queries (>1s duration)**
2. **High read count operations**
3. **Failed queries with index URLs**
4. **Read patterns approaching limits**

#### Alert Thresholds:
- **Warning**: >30,000 reads per day
- **Critical**: >45,000 reads per day
- **Slow query**: >1000ms duration
- **High read count**: >100 documents per query

### 7. Firestore Rules Optimization

Make sure your security rules are optimized:

```javascript
// ❌ Bad - This can cause extra reads
allow read: if request.auth != null && 
  exists(/databases/$(database)/documents/users/$(request.auth.uid));

// ✅ Good - Use resource-based checks when possible
allow read: if request.auth != null && 
  resource.data.userId == request.auth.uid;
```

### 8. Implementation Checklist

- [ ] Replace offset pagination with cursor pagination
- [ ] Implement batch operations for related data
- [ ] Add composite indexes for complex queries
- [ ] Implement smart cache invalidation
- [ ] Monitor read counts daily
- [ ] Set up alerts for approaching limits
- [ ] Optimize security rules
- [ ] Use subcollections for hierarchical data

### 9. Emergency Measures (If Near Limit)

If approaching the 50k read limit:

1. **Temporarily disable non-essential features**
2. **Increase cache TTL for static data**
3. **Implement aggressive request throttling**
4. **Switch to emulator for testing**
5. **Upgrade to Blaze plan if needed**

### 10. Testing Strategy

Use the Firebase emulator for development:
```bash
firebase emulators:start --only firestore
```

Set environment variable:
```
FIRESTORE_EMULATOR_HOST=localhost:8080
```

This prevents reads from counting against production limits during development.