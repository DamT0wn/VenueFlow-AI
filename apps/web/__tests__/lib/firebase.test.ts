import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockApp = { name: 'app' } as any;
const mockAuth = {} as any;
const mockDb = {} as any;

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => mockApp),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => mockApp),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockAuth),
  connectAuthEmulator: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => mockDb),
  connectFirestoreEmulator: vi.fn(),
}));

describe('firebase client helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env['NEXT_PUBLIC_FIREBASE_API_KEY'] = 'demo';
    process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'] = 'demo.firebaseapp.com';
    process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'] = 'demo-project';
    process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'] = 'demo.appspot.com';
    process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'] = '123';
    process.env['NEXT_PUBLIC_FIREBASE_APP_ID'] = '1:123:web:abc';
    process.env['NEXT_PUBLIC_GA_MEASUREMENT_ID'] = 'G-TEST1234';
  });

  it('returns client auth and firestore instances in browser env', async () => {
    const mod = await import('../../lib/firebase');

    expect(mod.getClientAuth()).toBe(mockAuth);
    expect(mod.getClientFirestore()).toBe(mockDb);
  });

  it('returns null for messaging when dynamic import fails', async () => {
    const mod = await import('../../lib/firebase');

    const fcm = await mod.getFCMInstance();
    expect(fcm).toBeNull();
  });

  it('returns null analytics when runtime import is unavailable', async () => {
    const mod = await import('../../lib/firebase');

    const analytics = await mod.getFirebaseAnalytics();
    expect(analytics).toBeNull();
  });
});
