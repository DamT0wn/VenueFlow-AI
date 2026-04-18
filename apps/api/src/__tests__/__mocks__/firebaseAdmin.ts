/**
 * Manual mock for Firebase Admin SDK.
 * Prevents real Firebase connections during unit tests.
 */

const mockFirestore = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  get: jest.fn().mockResolvedValue({ exists: false, data: () => null }),
  add: jest.fn().mockResolvedValue({ id: 'mock-doc-id' }),
  update: jest.fn().mockResolvedValue(undefined),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
};

export function db() {
  return mockFirestore;
}

export function auth() {
  return {
    verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-user' }),
  };
}

export function messaging() {
  return {
    send: jest.fn().mockResolvedValue('mock-message-id'),
  };
}

export function getFirebaseAdmin() {
  return {};
}
