'use client';

import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { APIProvider } from '@vis.gl/react-google-maps';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '../lib/firebase';
import { queryClient } from '../lib/queryClient';
import { initAnalytics, trackPageView } from '../lib/analytics';
import { useUserStore } from '../store/userStore';

const GOOGLE_MAPS_API_KEY = process.env['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'] ?? '';
const GOOGLE_MAPS_LIBRARIES = ['visualization', 'geometry'] as const;

// ──────────────────────────────────────────────────────────────────────────────
// Auth Provider
// ──────────────────────────────────────────────────────────────────────────────

function AuthProvider({ children }: { readonly children: ReactNode }) {
  const { setUser, setIdToken, setRole, signOut } = useUserStore();

  useEffect(() => {
    // firebaseAuth is null during SSR — only subscribe client-side
    if (!firebaseAuth) return;

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        const claims = await firebaseUser.getIdTokenResult();
        setUser(firebaseUser);
        setIdToken(token);
        setRole(claims.claims['role'] as string | undefined);
      } else {
        signOut();
      }
    });

    return unsubscribe;
  }, [setUser, setIdToken, setRole, signOut]);

  return <>{children}</>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Analytics Provider — tracks page views on route changes
// ──────────────────────────────────────────────────────────────────────────────

function AnalyticsProvider({ children }: { readonly children: ReactNode }) {
  const pathname = usePathname();

  // Initialise GA4 on first mount
  useEffect(() => {
    initAnalytics();
  }, []);

  // Track page view on every route change
  useLayoutEffect(() => {
    trackPageView(pathname, document.title);
  }, [pathname]);

  return <>{children}</>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Combined Providers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Root client providers wrapper.
 * Order: APIProvider (Maps) → QueryClientProvider → AuthProvider → AnalyticsProvider
 */
export default function Providers({ children }: { readonly children: ReactNode }) {
  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      libraries={[...GOOGLE_MAPS_LIBRARIES]}
      language="en"
      region="US"
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AnalyticsProvider>
            {children}
          </AnalyticsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </APIProvider>
  );
}
