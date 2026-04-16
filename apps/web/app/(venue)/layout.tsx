import { TopBar } from '../../components/layout/TopBar';
import { BottomNav } from '../../components/layout/BottomNav';
import type { ReactNode } from 'react';

/**
 * Venue route group layout.
 * Wraps all (venue) routes with TopBar and BottomNav.
 * Individual pages manage their own main element via PageContainer.
 */
export default function VenueLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-dvh bg-vf-bg-base">
      <TopBar />
      {children}
      <BottomNav />
    </div>
  );
}
