import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 🚫 Skip middleware for blog routes
  if (pathname.startsWith('/blog')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes EXCEPT:
     * - blog
     * - api
     * - _next
     * - static files
     */
    '/((?!blog|api|_next|favicon.ico).*)',
  ],
};