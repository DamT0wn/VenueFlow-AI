import { TopBar } from '../../components/layout/TopBar';
import { BottomNav } from '../../components/layout/BottomNav';
import { SocketInitializer } from '../../components/layout/SocketInitializer';
import { AIChatButton } from '../../components/chat/AIChatButton';
import { AmbientBackground } from '../../components/layout/AmbientBackground';
import { AnalyticsConsent } from '../../components/layout/AnalyticsConsent';
import { ErrorBoundary } from '../../components/layout/ErrorBoundary';
import type { ReactNode } from 'react';

export default function VenueLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-dvh relative" style={{ background: 'var(--vf-bg-base)' }}>
      {/* Ambient particle canvas — behind everything */}
      <AmbientBackground />
      <SocketInitializer />
      <TopBar />
      <ErrorBoundary name="VenueApp">
        <div className="relative z-10">
          {children}
        </div>
      </ErrorBoundary>
      <BottomNav />
      <AIChatButton />
      <AnalyticsConsent />
    </div>
  );
}
