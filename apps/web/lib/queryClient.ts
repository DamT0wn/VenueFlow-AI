import { QueryClient } from '@tanstack/react-query';

// ──────────────────────────────────────────────────────────────────────────────
// React Query client configuration
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Singleton React Query client.
 * - staleTime: 30 seconds — matches Redis crowd snapshot TTL
 * - gcTime: 5 minutes — keep cached data in memory for back-navigation
 * - retry: 2 — retry failed network requests twice before erroring
 * - refetchOnWindowFocus: true — refresh stale data when user returns to tab
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,              // 30 seconds
      gcTime: 5 * 60 * 1_000,        // 5 minutes
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1_000 * 2 ** attemptIndex, 30_000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
