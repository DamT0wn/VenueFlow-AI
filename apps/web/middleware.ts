import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware for route protection — handled by Providers component
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Redirect root to map (user will be redirected to login by Providers if not authenticated)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/map', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest).*)',
  ],
};

