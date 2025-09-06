// middleware.js
import { NextResponse } from 'next/server';

export function middleware(_req) {
  // No-op middleware: do not mutate request; per-route auth handles protection.
  return NextResponse.next();
}

// Limit middleware to app routes where you might later add logic
export const config = {
  matcher: [
    '/clients/:path*',
    '/dashboard/:path*',
    '/cleaners/edit/:path*',
    '/cleaners/dashboard/:path*',
    '/payment/:path*',
  ],
};
