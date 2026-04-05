import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import { protectApiRoute } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SITE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.findtrustedcleaners.com';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectToDatabase();
    const { valid, user, response } = await protectApiRoute(req);
    if (!valid) return response;
    if (user?.type !== 'cleaner') return NextResponse.json({ error: 'Access denied.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const cleanerId = String(body?.cleanerId || user?._id || user?.id || '');
    if (!cleanerId) return NextResponse.json({ error: 'Missing cleanerId' }, { status: 400 });

    const cleaner = await Cleaner.findById(cleanerId);
    if (!cleaner) return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 });

    const successUrl = `${SITE_URL}/cleaners/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${SITE_URL}/cleaners/dashboard?upgrade=cancelled`;
    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: cleaner.email,
      line_items: priceId
        ? [{ price: priceId, quantity: 1 }]
        : [{ price_data: { currency: 'gbp', unit_amount: 799, recurring: { interval: 'month' }, product_data: { name: 'Find Trusted Cleaners Premium', description: 'Premium cleaner profile upgrade' } }, quantity: 1 }],
      metadata: { cleanerId: String(cleaner._id), premiumUpgrade: 'true', subscription: 'true' },
      client_reference_id: String(cleaner._id),
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (err) {
    console.error('❌ Stripe session error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create Stripe session' }, { status: 500 });
  }
}
