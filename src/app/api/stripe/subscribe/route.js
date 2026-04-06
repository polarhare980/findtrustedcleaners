import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  console.warn('[premium-checkout] Deprecated route hit', { route: '/api/stripe/subscribe' });
  return NextResponse.json(
    {
      success: false,
      deprecated: true,
      message: 'This premium route has been retired. Use /api/stripe/create-checkout-session instead.',
    },
    { status: 410 }
  );
}
