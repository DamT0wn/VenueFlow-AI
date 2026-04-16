import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ──────────────────────────────────────────────────────────────────────────────
// Next.js Edge Middleware — DEV MODE: auth gate disabled
// To re-enable auth gating, restore the commented-out logic below.
// ──────────────────────────────────────────────────────────────────────────────

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Auto-redirect the login page straight to /map so the app is immediately visible
  if (pathname === '/login' || pathname === '/') {
    return NextResponse.redirect(new URL('/map', request.url));
  }

  // Pass everything else through — no auth gate in dev mode
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|firebase-messaging-sw.js).*)',
  ],
};
