import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let db: Firestore;

export function initializeFirestore(): Firestore {
  if (db) return db;

  // Inicializar Firebase Admin si no existe
  if (!getApps().length) {
    const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (process.env.NODE_ENV === 'development') {
      // Usar emulador en desarrollo
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
      initializeApp({ projectId });
    } else {
      // Usar credenciales en producción
      initializeApp({
        credential: cert(serviceAccount!),
        projectId
      });
    }
  }

  db = getFirestore();
  return db;
}

export function getDb(): Firestore {
  if (!db) {
    db = initializeFirestore();
  }
  return db;
}
