import { TopBar } from '../../components/layout/TopBar';
import { BottomNav } from '../../components/layout/BottomNav';
import { SocketInitializer } from '../../components/layout/SocketInitializer';
import { AIChatButton } from '../../components/chat/AIChatButton';
import type { ReactNode } from 'react';

export default function VenueLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-dvh" style={{ background: 'var(--vf-bg-base)' }}>
      <SocketInitializer />
      <TopBar />
      {children}
      <BottomNav />
      <AIChatButton />
    </div>
  );
}
