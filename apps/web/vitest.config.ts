import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const ciTestOptions = process.env.CI
  ? {
      fileParallelism: false,
      poolOptions: {
        threads: {
          minThreads: 1,
          maxThreads: 1,
        },
      },
    }
  : {};

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/__tests__/**/*.test.{ts,tsx}'],
    ...ciTestOptions,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['store/**', 'lib/**', 'hooks/**'],
      thresholds: { lines: 60, functions: 60 },
    },
  },
  resolve: {
    alias: {
      '@web': path.resolve(__dirname, '.'),
      '@shared': path.resolve(__dirname, '../../packages/shared-types/src'),
    },
  },
});
