import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth is disabled — app opens directly, no login required.
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  // Redirect root and /login straight to the app
  if (pathname === '/' || pathname === '/login') {
    return NextResponse.redirect(new URL('/recommendations', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest).*)',
  ],
};
