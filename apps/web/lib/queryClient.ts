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
      staleTime:            60_000,   // 1 min — socket handles real-time, REST is secondary
      gcTime:               3 * 60_000, // 3 min
      retry:                1,
      retryDelay:           1_000,
      refetchOnWindowFocus: false,    // socket keeps data fresh
      refetchOnReconnect:   true,
    },
    mutations: { retry: 0 },
  },
});
