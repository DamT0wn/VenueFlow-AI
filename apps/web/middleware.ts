import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth completely removed — app opens directly with no login required.
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Redirect root, /login, and /auth paths straight to the map
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/login')
  ) {
    return NextResponse.redirect(new URL('/map', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest).*)',
  ],
};
