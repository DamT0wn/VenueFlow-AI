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
const envOrUndefined = (key: string): string | undefined => {
  const value = process.env[key];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const measurementId = envOrUndefined('NEXT_PUBLIC_GA_MEASUREMENT_ID');

const firebaseConfig = {
  apiKey:            envOrUndefined('NEXT_PUBLIC_FIREBASE_API_KEY') ?? 'demo-api-key-for-emulator',
  authDomain:        envOrUndefined('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN') ?? 'demo-venueflow.firebaseapp.com',
  projectId:         envOrUndefined('NEXT_PUBLIC_FIREBASE_PROJECT_ID') ?? 'demo-venueflow',
  storageBucket:     envOrUndefined('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET') ?? '',
  messagingSenderId: envOrUndefined('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') ?? '000000000000',
  appId:             envOrUndefined('NEXT_PUBLIC_FIREBASE_APP_ID') ?? '1:000000000000:web:demo000000000000',
  ...(measurementId ? { measurementId } : {}),
};

// ──────────────────────────────────────────────────────────────────────────────
// Singleton state — separate flags per service to avoid the bug where one
// service's flag blocks another service from connecting to the emulator.
// ──────────────────────────────────────────────────────────────────────────────

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _firestore: Firestore | null = null;
let _authEmulatorConnected = false;
let _firestoreEmulatorConnected = false;

function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return _app;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getFirebaseApp());

  if (typeof window !== 'undefined' && USE_EMULATOR && !_authEmulatorConnected) {
    _authEmulatorConnected = true; // set before calling to prevent double-connect on hot reload
    try {
      connectAuthEmulator(_auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    } catch {
      // Already connected — safe to ignore
    }
  }

  return _auth;
}

// ── Firestore ─────────────────────────────────────────────────────────────────

function getFirebaseFirestore(): Firestore {
  if (_firestore) return _firestore;
  _firestore = getFirestore(getFirebaseApp());

  if (typeof window !== 'undefined' && USE_EMULATOR && !_firestoreEmulatorConnected) {
    _firestoreEmulatorConnected = true;
    try {
      connectFirestoreEmulator(_firestore, '127.0.0.1', 8080);
    } catch {
      // Already connected — safe to ignore
    }
  }

  return _firestore;
}

// ── Public accessors (always call as functions on the client) ─────────────────

/**
 * Returns the Firebase Auth instance.
 * Always call this as a function — never cache the return value at module level.
 * Returns null in SSR environments.
 */
export function getClientAuth(): Auth | null {
  if (typeof window === 'undefined') return null;
  return getFirebaseAuth();
}

/**
 * Returns the Firestore instance.
 * Returns null in SSR environments.
 */
export function getClientFirestore(): Firestore | null {
  if (typeof window === 'undefined') return null;
  return getFirebaseFirestore();
}

/**
 * @deprecated Use getClientAuth() instead.
 * Kept for backward compatibility — returns null on SSR, Auth on client.
 */
export const firebaseAuth: Auth | null =
  typeof window !== 'undefined' ? getFirebaseAuth() : null;

/**
 * @deprecated Use getClientFirestore() instead.
 * Kept for backward compatibility — returns null on SSR, Firestore on client.
 */
export const firestore: Firestore | null =
  typeof window !== 'undefined' ? getFirebaseFirestore() : null;

export { getFirebaseApp as firebaseApp };

// ── Messaging (FCM) ───────────────────────────────────────────────────────────

/**
 * Returns FCM instance lazily. Returns null in SSR or unsupported browsers.
 */
export async function getFCMInstance(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  if (USE_EMULATOR) return null; // FCM not supported in emulator
  if (typeof navigator === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;
  if (!('Notification' in window)) return null;
  if (!('PushManager' in window)) return null;

  try {
    const { getMessaging, isSupported } = await import('firebase/messaging');
    const supported = await isSupported().catch(() => false);
    if (!supported) return null;
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
