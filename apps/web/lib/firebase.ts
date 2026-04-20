import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  getDoc,
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

/**
 * Ensures a Firebase anonymous user session exists.
 * Returns the active user (existing or newly created).
 */
export async function ensureAnonymousAuth(): Promise<User> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

/**
 * Gets the current Firebase ID token, refreshing it if needed.
 */
export async function getIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken();
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

// ── Google Sign-In ────────────────────────────────────────────────────────────

/**
 * Signs in user with Google via OAuth popup.
 * Returns the signed-in user.
 */
export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/**
 * Signs out the current user.
 */
export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

// ── Firestore User Management ─────────────────────────────────────────────────

/**
 * User profile data structure.
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'user' | 'admin';
  createdAt: number;
  lastSignIn: number;
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
    analyticsConsent?: boolean;
  };
}

/**
 * Saves or updates a user profile in Firestore.
 */
export async function saveUserProfile(user: User): Promise<UserProfile> {
  const firestore = getFirebaseFirestore();
  
  const userRef = doc(collection(firestore, 'users'), user.uid);
  const existingDoc = await getDoc(userRef);
  
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: 'user',
    createdAt: existingDoc.exists() ? (existingDoc.data() as UserProfile).createdAt : Date.now(),
    lastSignIn: Date.now(),
  };
  
  await setDoc(userRef, profile, { merge: true });
  return profile;
}

/**
 * Retrieves a user profile from Firestore.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const firestore = getFirebaseFirestore();
  const userRef = doc(collection(firestore, 'users'), uid);
  const docSnap = await getDoc(userRef);
  
  if (!docSnap.exists()) return null;
  return docSnap.data() as UserProfile;
}
