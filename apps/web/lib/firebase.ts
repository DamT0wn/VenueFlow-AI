import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';
import type { Analytics } from 'firebase/analytics';
import type { Messaging } from 'firebase/messaging';

// ──────────────────────────────────────────────────────────────────────────────
// Firebase client config — sourced from NEXT_PUBLIC_ env vars
// ──────────────────────────────────────────────────────────────────────────────

const USE_EMULATOR = process.env['NEXT_PUBLIC_USE_EMULATOR'] === 'true';

const measurementId = process.env['NEXT_PUBLIC_GA_MEASUREMENT_ID'];

const firebaseConfig = {
  apiKey:            process.env['NEXT_PUBLIC_FIREBASE_API_KEY'] ?? 'demo-key',
  authDomain:        process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'] ?? 'demo-venueflow.firebaseapp.com',
  projectId:         process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] ?? 'demo-venueflow',
  storageBucket:     process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'] ?? '',
  messagingSenderId: process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'] ?? '000000000000',
  appId:             process.env['NEXT_PUBLIC_FIREBASE_APP_ID'] ?? '1:000000000000:web:demo',
  ...(measurementId ? { measurementId } : {}),
};

// ──────────────────────────────────────────────────────────────────────────────
// Singleton app
// ──────────────────────────────────────────────────────────────────────────────

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _firestore: Firestore | null = null;
let _emulatorsConnected = false;

function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return _app;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getFirebaseApp());

  if (typeof window !== 'undefined' && USE_EMULATOR && !_emulatorsConnected) {
    try {
      connectAuthEmulator(_auth, 'http://localhost:9099', { disableWarnings: true });
    } catch {
      // Already connected in hot-reload
    }
  }

  return _auth;
}

// ── Firestore ─────────────────────────────────────────────────────────────────

function getFirebaseFirestore(): Firestore {
  if (_firestore) return _firestore;
  _firestore = getFirestore(getFirebaseApp());

  if (typeof window !== 'undefined' && USE_EMULATOR && !_emulatorsConnected) {
    try {
      connectFirestoreEmulator(_firestore, 'localhost', 8080);
    } catch {
      // Already connected in hot-reload
    }
    _emulatorsConnected = true;
  }

  return _firestore;
}

// ── Public singletons ─────────────────────────────────────────────────────────

/** Firebase Auth singleton (lazy, emulator-aware). */
export const firebaseAuth = typeof window !== 'undefined'
  ? getFirebaseAuth()
  : (null as unknown as Auth);          // SSR: auth is client-only

/** Firestore singleton (lazy, emulator-aware). */
export const firestore = typeof window !== 'undefined'
  ? getFirebaseFirestore()
  : (null as unknown as Firestore);     // SSR: Firestore is client-only

export { getFirebaseApp as firebaseApp };

// ── Messaging (FCM) ───────────────────────────────────────────────────────────

/**
 * Returns FCM instance lazily. Returns null in SSR or unsupported browsers.
 */
export async function getFCMInstance(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  if (USE_EMULATOR) return null; // FCM not supported in emulator
  try {
    const { getMessaging } = await import('firebase/messaging');
    return getMessaging(getFirebaseApp());
  } catch {
    return null;
  }
}

// ── Analytics ─────────────────────────────────────────────────────────────────

let _analytics: Analytics | null = null;

/**
 * Returns GA4 Analytics instance lazily. Returns null if no measurementId or in SSR.
 */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined' || !firebaseConfig.measurementId) return null;
  if (_analytics) return _analytics;
  try {
    const { getAnalytics } = await import('firebase/analytics');
    _analytics = getAnalytics(getFirebaseApp());
    return _analytics;
  } catch {
    return null;
  }
}
