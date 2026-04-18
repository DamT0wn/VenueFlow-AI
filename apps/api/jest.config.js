/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@venueflow/shared-types$': '<rootDir>/../../packages/shared-types/src/index.ts',
    '^@venueflow/venue-data$': '<rootDir>/../../packages/venue-data/src/index.ts',
    '^../lib/redis$': '<rootDir>/src/__tests__/__mocks__/redis.ts',
    '^../../lib/redis$': '<rootDir>/src/__tests__/__mocks__/redis.ts',
    '^../lib/firebaseAdmin$': '<rootDir>/src/__tests__/__mocks__/firebaseAdmin.ts',
    '^../../lib/firebaseAdmin$': '<rootDir>/src/__tests__/__mocks__/firebaseAdmin.ts',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        // Relax strict settings for tests
        noUnusedLocals: false,
        noUnusedParameters: false,
        exactOptionalPropertyTypes: false,
      },
    }],
  },
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/middleware/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThresholds: {
    global: { lines: 70, functions: 70, branches: 60 },
  },
};
