import { db } from './client';

export interface Migration {
  version: string;
  description: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

export class MigrationRunner {
  private migrationsCollection = db().collection('_migrations');

  async run(migrations: Migration[]): Promise<void> {
    for (const migration of migrations) {
      const applied = await this.isMigrationApplied(migration.version);
      
      if (!applied) {
        console.log(`Running migration ${migration.version}: ${migration.description}`);
        
        try {
          await migration.up();
          await this.markMigrationAsApplied(migration);
          console.log(`Migration ${migration.version} completed`);
        } catch (error) {
          console.error(`Migration ${migration.version} failed:`, error);
          throw error;
        }
      }
    }
  }

  async rollback(migration: Migration): Promise<void> {
    if (!migration.down) {
      throw new Error(`Migration ${migration.version} has no rollback function`);
    }

    console.log(`Rolling back migration ${migration.version}`);
    
    try {
      await migration.down();
      await this.markMigrationAsRolledBack(migration.version);
      console.log(`Migration ${migration.version} rolled back`);
    } catch (error) {
      console.error(`Rollback of migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  private async isMigrationApplied(version: string): Promise<boolean> {
    const doc = await this.migrationsCollection.doc(version).get();
    return doc.exists;
  }

  private async markMigrationAsApplied(migration: Migration): Promise<void> {
    await this.migrationsCollection.doc(migration.version).set({
      version: migration.version,
      description: migration.description,
      appliedAt: new Date(),
    });
  }

  private async markMigrationAsRolledBack(version: string): Promise<void> {
    await this.migrationsCollection.doc(version).delete();
  }

  async getAppliedMigrations(): Promise<string[]> {
    const snapshot = await this.migrationsCollection.orderBy('appliedAt').get();
    return snapshot.docs.map(doc => doc.id);
  }
}

// Sample migrations
export const migrations: Migration[] = [
  {
    version: '001_create_indexes',
    description: 'Create initial database indexes',
    up: async () => {
      // Note: Firestore indexes are usually created through Firebase Console
      // or firebase.json, but you can create them programmatically too
      console.log('Creating indexes...');
      
      // This is just a placeholder - actual index creation would be done
      // through Firebase Console or CLI commands
    },
  },
  {
    version: '002_add_default_data',
    description: 'Add default system data',
    up: async () => {
      // Add any default data needed
      const systemCollection = db().collection('system');
      
      await systemCollection.doc('config').set({
        version: '1.0.0',
        features: {
          vectorSearch: true,
          aiAnalysis: true,
          realtimeUpdates: true,
        },
        limits: {
          maxRepoSize: 500 * 1024 * 1024, // 500MB
          maxFileSize: 10 * 1024 * 1024,  // 10MB
          maxConcurrentJobs: 5,
        },
        createdAt: new Date(),
      });
    },
  },
];

export const migrationRunner = new MigrationRunner();