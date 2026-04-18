import * as admin from 'firebase-admin';
import { env } from '../config/env';
import { logger } from './logger';

// ──────────────────────────────────────────────────────────────────────────────
// Firebase Admin singleton
// Initialises once; subsequent imports receive the cached instance.
// ──────────────────────────────────────────────────────────────────────────────

let app: admin.app.App;

/**
 * Returns the initialised Firebase Admin app singleton.
 * Safe to call multiple times — always returns the same instance.
 *
 * @returns {admin.app.App} The Firebase Admin app instance.
 */
export function getFirebaseAdmin(): admin.app.App {
  if (app) return app;

  const isEmulator =
    Boolean(process.env['FIRESTORE_EMULATOR_HOST']) ||
    Boolean(process.env['FIREBASE_AUTH_EMULATOR_HOST']);

  try {
    if (isEmulator) {
      app = admin.initializeApp({ projectId: env.FIREBASE_PROJECT_ID });
    } else if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as admin.ServiceAccount;
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: env.FIREBASE_PROJECT_ID,
      });
    } else {
      // Cloud Run — use Application Default Credentials
      app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: env.FIREBASE_PROJECT_ID,
      });
    }
  } catch (err) {
    // Fallback: init without credentials (auth is bypassed anyway)
    logger.warn({ message: 'Firebase Admin: credential init failed, using no-auth mode', error: (err as Error).message });
    if (!admin.apps.length) {
      app = admin.initializeApp({ projectId: env.FIREBASE_PROJECT_ID });
    } else {
      app = admin.app();
    }
  }

  return app;
}

/**
 * Firestore database instance.
 * Uses Google Cloud Firestore with offline support disabled server-side.
 */
export const db = (): admin.firestore.Firestore => getFirebaseAdmin().firestore();

/**
 * Firebase Auth instance.
 */
export const auth = (): admin.auth.Auth => getFirebaseAdmin().auth();

/**
 * Firebase Cloud Messaging instance.
 */
export const messaging = (): admin.messaging.Messaging => getFirebaseAdmin().messaging();

// Initialise immediately so errors surface at startup
getFirebaseAdmin();
