"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeFirestore = initializeFirestore;
exports.getDb = getDb;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
let db;
function initializeFirestore() {
    if (db)
        return db;
    // Inicializar Firebase Admin si no existe
    if (!(0, app_1.getApps)().length) {
        const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        const projectId = process.env.FIREBASE_PROJECT_ID;
        if (process.env.NODE_ENV === 'development') {
            // Usar emulador en desarrollo
            process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
            (0, app_1.initializeApp)({ projectId });
        }
        else {
            // Usar credenciales en producción
            (0, app_1.initializeApp)({
                credential: (0, app_1.cert)(serviceAccount),
                projectId
            });
        }
    }
    db = (0, firestore_1.getFirestore)();
    return db;
}
function getDb() {
    if (!db) {
        db = initializeFirestore();
    }
    return db;
}
//# sourceMappingURL=firestore.js.map