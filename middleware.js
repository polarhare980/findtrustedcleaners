// middleware.js
import { NextResponse } from 'next/server';
import { middleware as authMiddleware } from './src/lib/middleware';

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // ✅ Special case: raw body passthrough for Stripe webhook
  if (pathname.startsWith('/api/stripe/webhook-client-booking')) {
    return new NextResponse(req.body, {
      headers: req.headers,
    });
  }

  // ✅ Everything else: apply your existing auth middleware
  return authMiddleware(req);
}

// ✅ Apply both middleware types only to matching paths
export const config = {
  matcher: [
    // Stripe webhook must be handled raw
    '/api/stripe/webhook-client-booking',

    // Your protected routes
    '/clients/:path*',
    '/dashboard/:path*',
    '/cleaners/edit/:path*',
    '/cleaners/dashboard/:path*',
  ],
};
