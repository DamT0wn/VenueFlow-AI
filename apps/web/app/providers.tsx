'use client';

import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { APIProvider } from '@vis.gl/react-google-maps';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { getClientAuth } from '../lib/firebase';
import { queryClient } from '../lib/queryClient';
import { initAnalytics, trackPageView } from '../lib/analytics';
import { useUserStore } from '../store/userStore';

const GOOGLE_MAPS_API_KEY = process.env['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'] ?? '';
const GOOGLE_MAPS_LIBRARIES = ['visualization', 'geometry'] as const;

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Writes the Firebase ID token and role into cookies so that the
 * Next.js Edge middleware (/middleware.ts) can gate protected routes.
 *
 * SameSite=Lax allows the cookie to be sent after redirect-based OAuth flows.
 * max-age matches the Firebase ID token lifetime (1 hour).
 */
async function writeSessionCookies(role?: string): Promise<void> {
  const auth = getClientAuth();
  if (!auth?.currentUser) return;
  try {
    const token = await auth.currentUser.getIdToken();
    document.cookie = `__session=${token}; path=/; SameSite=Lax; max-age=3600`;
    document.cookie = `__role=${role ?? 'user'}; path=/; SameSite=Lax; max-age=3600`;
  } catch {
    // Non-fatal — cookies will be set on the next onAuthStateChanged tick
  }
}

function clearSessionCookies(): void {
  document.cookie = '__session=; path=/; max-age=0';
  document.cookie = '__role=; path=/; max-age=0';
}

// ──────────────────────────────────────────────────────────────────────────────
// Auth Provider
// ──────────────────────────────────────────────────────────────────────────────

function AuthProvider({ children }: { readonly children: ReactNode }) {
  const { setUser, setIdToken, setRole, signOut } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    const auth = getClientAuth();
    // firebaseAuth is null during SSR — only subscribe client-side
    if (!auth) return;

    // ── Handle Google redirect result ───────────────────────────────────────
    // Must be called on every page load after signInWithRedirect resolves.
    // It's a no-op when there is no pending redirect.
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        const token = await result.user.getIdToken();
        const claims = await result.user.getIdTokenResult();
        const role = claims.claims['role'] as string | undefined;

        setUser(result.user);
        setIdToken(token);
        setRole(role);

        document.cookie = `__session=${token}; path=/; SameSite=Lax; max-age=3600`;
        document.cookie = `__role=${role ?? 'user'}; path=/; SameSite=Lax; max-age=3600`;

        // Navigate to /map after successful Google redirect sign-in
        router.replace('/map');
      }
    }).catch(() => {
      // No pending redirect or error — safe to ignore
    });

    // ── Ongoing auth state listener ─────────────────────────────────────────
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        const claims = await firebaseUser.getIdTokenResult();
        const role = claims.claims['role'] as string | undefined;

        setUser(firebaseUser);
        setIdToken(token);
        setRole(role);

        // Set session cookies so the Next.js Edge middleware can see the auth state.
        // SameSite=Lax allows cookies to be present after redirect-based OAuth flows.
        document.cookie = `__session=${token}; path=/; SameSite=Lax; max-age=3600`;
        document.cookie = `__role=${role ?? 'user'}; path=/; SameSite=Lax; max-age=3600`;
      } else {
        signOut();
        clearSessionCookies();
      }
    });

    return unsubscribe;
  }, [setUser, setIdToken, setRole, signOut, router]);

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

export { writeSessionCookies };
