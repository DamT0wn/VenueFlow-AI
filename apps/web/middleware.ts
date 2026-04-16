import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ──────────────────────────────────────────────────────────────────────────────
// Next.js Edge Middleware — authentication and role-based routing
//
// Strategy: this middleware reads a session token cookie set by the client
// after Firebase Auth sign-in. It does NOT verify the JWT (that would require
// firebase-admin which can't run in the Edge runtime). The API server performs
// full token verification.
//
// For this reason the middleware provides UI-level guards only — the API is
// the authoritative security boundary.
// ──────────────────────────────────────────────────────────────────────────────

const PUBLIC_PATHS = ['/login', '/api/health'];
const ADMIN_PREFIX = '/admin';

/**
 * Next.js middleware for client-side route guarding.
 * - Unauthenticated users → /login (except PUBLIC_PATHS)
 * - Non-admin users accessing /admin/* → /map
 *
 * @param {NextRequest} request - Incoming request
 * @returns {NextResponse} Redirect or pass-through response
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Read session indicators from cookies
  const sessionToken = request.cookies.get('__session')?.value;
  const userRole = request.cookies.get('__role')?.value;

  // Redirect unauthenticated users to /login
  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect non-admins away from /admin
  if (pathname.startsWith(ADMIN_PREFIX) && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/map', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, icons, public assets
     * - manifest.webmanifest
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|firebase-messaging-sw.js).*)',
  ],
};
