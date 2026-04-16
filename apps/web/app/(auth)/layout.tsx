import type { ReactNode } from 'react';

/**
 * Auth route group layout — no nav chrome.
 * Pages in (auth) render full-screen.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
