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
    await connectToDatabase();

    const { valid, user, response } = await protectApiRoute(req);
    if (!valid) return response;
    if (user?.type !== 'cleaner') {
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const sessionId = String(body?.sessionId || '').trim();
    const cleanerId = String(user?._id || user?.id || '').trim();

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Missing session ID.' }, { status: 400 });
    }
    if (!cleanerId) {
      return NextResponse.json({ success: false, error: 'Missing cleaner ID.' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    const metadataCleanerId = String(session?.metadata?.cleanerId || session?.client_reference_id || '').trim();
    if (!metadataCleanerId || metadataCleanerId !== cleanerId) {
      return NextResponse.json({ success: false, error: 'Session does not belong to this cleaner.' }, { status: 403 });
    }

    const mode = String(session?.mode || '');
    const paymentStatus = String(session?.payment_status || '');
    const subscriptionStatus = String(session?.subscription?.status || '');
    const eligible = mode === 'subscription' && (
      paymentStatus === 'paid' ||
      ['active', 'trialing'].includes(subscriptionStatus)
    );

    if (!eligible) {
      return NextResponse.json({
        success: false,
        pending: true,
        message: 'Payment is still being confirmed.',
        sessionStatus: session?.status || null,
        paymentStatus,
        subscriptionStatus,
      });
    }

    await Cleaner.findByIdAndUpdate(cleanerId, {
      isPremium: true,
      stripeCustomerId: session?.customer || '',
      stripeSubscriptionId:
        typeof session?.subscription === 'object'
          ? (session.subscription?.id || '')
          : (session?.subscription || ''),
      premiumSince: new Date(),
    });

    const updatedCleaner = await Cleaner.findById(cleanerId).select('isPremium premiumSince stripeSubscriptionId');

    return NextResponse.json({
      success: true,
      isPremium: !!updatedCleaner?.isPremium,
      premiumSince: updatedCleaner?.premiumSince || null,
      stripeSubscriptionId: updatedCleaner?.stripeSubscriptionId || '',
    });
  } catch (err) {
    console.error('[confirm-upgrade-session] failed', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to confirm upgrade.' }, { status: 500 });
  }
}
