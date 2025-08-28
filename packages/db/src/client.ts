import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

class FirebaseClient {
  private app: App | null = null;
  private db: Firestore | null = null;

  initialize() {
    if (this.app) {
      return this.app;
    }

    const apps = getApps();
    if (apps.length > 0) {
      this.app = apps[0];
    } else {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      if (process.env.NODE_ENV === 'development' && process.env.FIRESTORE_EMULATOR_HOST) {
        // Use emulator in development
        this.app = initializeApp({
          projectId: projectId || 'kontexto-dev',
        });
      } else if (projectId && clientEmail && privateKey) {
        // Use service account with environment variables
        this.app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
          projectId,
        });
      } else {
        throw new Error('Firebase credentials not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.');
      }
    }

    this.db = getFirestore(this.app);
    
    // Configure settings only if not in serverless environment
    try {
      this.db.settings({
        ignoreUndefinedProperties: true,
      });
    } catch (error) {
      // Settings already configured, ignore error
    }

    return this.app;
  }

  getFirestore(): Firestore {
    if (!this.db) {
      this.initialize();
    }
    return this.db!;
  }
}

export const firebaseClient = new FirebaseClient();
export const db = () => firebaseClient.getFirestore();