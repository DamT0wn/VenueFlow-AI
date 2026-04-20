'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { SplashScreen } from '../components/layout/SplashScreen';
import { useUserStore } from '../store/userStore';
import { saveUserProfile } from '../lib/firebase';

const SPLASH_KEY = 'vf_splash_shown';
const PUBLIC_ROUTES = ['/login', '/auth/login'];

export default function Providers({ children }: { readonly children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, setIdToken } = useUserStore();
  const [showSplash, setShowSplash] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // Set up Firebase auth state listener
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        setUser(user);

        // Get ID token
        const token = await user.getIdToken();
        setIdToken(token);

        // Save/update user profile in Firestore
        try {
          await saveUserProfile(user);
        } catch (err) {
          console.error('Failed to save user profile:', err);
        }

        // Show splash if first time and not in public route
        const shown = sessionStorage.getItem(SPLASH_KEY);
        if (!shown && !PUBLIC_ROUTES.includes(pathname)) {
          setShowSplash(true);
        } else {
          setAuthReady(true);
        }
      } else {
        // User is not signed in
        setUser(null);
        setIdToken(null);
        setAuthReady(true);

        // Redirect to login if trying to access protected route
        if (!PUBLIC_ROUTES.includes(pathname)) {
          router.replace('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [router, pathname, setUser, setIdToken]);

  const handleSplashComplete = () => {
    sessionStorage.setItem(SPLASH_KEY, '1');
    setShowSplash(false);
    setAuthReady(true);
    router.replace('/map');
  };

  // Don't render until auth is checked
  if (!authReady) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="w-screen h-screen bg-slate-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div style={{ visibility: !showSplash ? 'visible' : 'hidden' }}>
        {children}
      </div>
    </QueryClientProvider>
  );
}

