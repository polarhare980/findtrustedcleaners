import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import { protectApiRoute } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { valid, user, response } = await protectApiRoute(req, 'cleaner');
    if (!valid) return response;

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Missing session_id' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    const metadata = session?.metadata || {};
    const cleanerId = String(metadata.cleanerId || session.client_reference_id || user?._id || user?.id || '');
    if (!cleanerId) {
      return NextResponse.json({ success: false, error: 'Missing cleaner reference on session' }, { status: 400 });
    }

    const paid = session?.payment_status === 'paid' || session?.status === 'complete';
    const subscriptionId = typeof session?.subscription === 'string'
      ? session.subscription
      : session?.subscription?.id || null;

    if (!paid && !subscriptionId) {
      return NextResponse.json({
        success: false,
        pending: true,
        error: 'Checkout not completed yet',
      }, { status: 202 });
    }

    await connectToDatabase();
    const cleaner = await Cleaner.findById(cleanerId);
    if (!cleaner) {
      return NextResponse.json({ success: false, error: 'Cleaner not found' }, { status: 404 });
    }

    if (String(cleaner._id) !== String(user?._id || user?.id || '')) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    cleaner.isPremium = true;
    cleaner.stripeCustomerId = session.customer || cleaner.stripeCustomerId || '';
    cleaner.stripeSubscriptionId = subscriptionId || cleaner.stripeSubscriptionId || '';
    if (!cleaner.premiumSince) cleaner.premiumSince = new Date();
    if (typeof cleaner.premiumWeeksAhead !== 'number' || cleaner.premiumWeeksAhead < 3) {
      cleaner.premiumWeeksAhead = 3;
    }

    await cleaner.save();

    return NextResponse.json({
      success: true,
      cleanerId: String(cleaner._id),
      isPremium: true,
    });
  } catch (err) {
    console.error('[confirm-upgrade] failed', err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to confirm premium upgrade',
    }, { status: 500 });
  }
}
