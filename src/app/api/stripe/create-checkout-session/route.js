import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import { protectApiRoute } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const DEFAULT_SITE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.findtrustedcleaners.com';

function getBaseUrl(req) {
  const origin = req?.headers?.get?.('origin');
  if (origin) return origin.replace(/\/$/, '');

  const host = req?.headers?.get?.('x-forwarded-host') || req?.headers?.get?.('host');
  const proto = req?.headers?.get?.('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  if (host) return `${proto}://${host}`;

  return DEFAULT_SITE_URL.replace(/\/$/, '');
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function logCheckout(message, extra = {}) {
  console.info(`[premium-checkout] ${message}`, extra);
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const { valid, user, response } = await protectApiRoute(req);
    if (!valid) return response;
    if (user?.type !== 'cleaner') {
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const cleanerId = String(body?.cleanerId || user?._id || user?.id || '');
    if (!cleanerId) {
      return NextResponse.json({ success: false, error: 'Missing cleanerId' }, { status: 400 });
    }

    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
    if (!priceId) {
      console.error('[premium-checkout] Missing STRIPE_PREMIUM_PRICE_ID');
      return NextResponse.json({ success: false, error: 'Premium pricing is not configured.' }, { status: 500 });
    }

    const cleaner = await Cleaner.findById(cleanerId).select('_id email stripeCustomerId').lean();
    if (!cleaner) {
      return NextResponse.json({ success: false, error: 'Cleaner not found' }, { status: 404 });
    }

    const baseUrl = getBaseUrl(req);

    logCheckout('route hit', { route: '/api/stripe/create-checkout-session', cleanerId: String(cleaner._id), priceId, baseUrl });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ...(cleaner.stripeCustomerId ? { customer: cleaner.stripeCustomerId } : cleaner.email ? { customer_email: cleaner.email } : {}),
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        cleanerId: String(cleaner._id),
        planType: 'premium_yearly',
        premiumUpgrade: 'true',
        subscription: 'true',
        source: 'cleaner_dashboard',
      },
      client_reference_id: String(cleaner._id),
      success_url: `${baseUrl}/cleaners/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cleaners/dashboard?upgrade=cancelled`,
    });

    logCheckout('session created', { cleanerId: String(cleaner._id), sessionId: session.id, priceId });
    return NextResponse.json({ success: true, url: session.url });
  } catch (err) {
    console.error('[premium-checkout] failed', { route: '/api/stripe/create-checkout-session', message: err?.message || 'Unknown error' });
    return NextResponse.json({ success: false, error: err?.message || 'Failed to create Stripe session' }, { status: 500 });
  }
}
