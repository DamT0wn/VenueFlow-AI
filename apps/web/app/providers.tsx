'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { SplashScreen } from '../components/layout/SplashScreen';

const SPLASH_KEY = 'vf_splash_shown';

export default function Providers({ children }: { readonly children: ReactNode }) {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem(SPLASH_KEY);
    if (!shown) {
      setShowSplash(true);
    } else {
      setSplashDone(true);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem(SPLASH_KEY, '1');
    setSplashDone(true);
    setShowSplash(false);
    // Navigate to map after splash — no login needed
    router.replace('/map');
  };

  return (
    <QueryClientProvider client={queryClient}>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div style={{ visibility: splashDone || !showSplash ? 'visible' : 'hidden' }}>
        {children}
      </div>
    </QueryClientProvider>
  );
}
