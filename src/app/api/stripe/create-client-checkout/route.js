// File: src/app/api/stripe/create-client-checkout/route.js
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { protectRoute } from '@/lib/auth';
import Cleaner from '@/models/Cleaner';
import Purchase from '@/models/Purchase'; // <-- ensure this exists

// Optional (but recommended) for edge errors: specify node runtime
// export const runtime = 'nodejs'; 

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.warn('[Stripe] STRIPE_SECRET_KEY is not set');
}
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  // apiVersion: '2024-06-20', // pin if you like; otherwise use default project version
});

const SITE_URL = process.env.SITE_URL || 'https://www.findtrustedcleaners.com';

export async function POST(req) {
  // Must be an authenticated client
  const { valid, user } = await protectRoute(req);
  if (!valid || user?.type !== 'client') {
    return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { purchaseId } = body || {};
    if (!purchaseId) {
      return NextResponse.json({ success: false, message: 'Missing purchaseId' }, { status: 400 });
    }

    await connectToDatabase();

    // 1) Load purchase and validate ownership/state
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return NextResponse.json({ success: false, message: 'Purchase not found' }, { status: 404 });
    }

    // Client must own this purchase
    if (String(purchase.clientId) !== String(user._id)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Only allow creating checkout for "pending" (or your chosen pre-pay state)
    const status = String(purchase.status || '').toLowerCase();
    if (!['pending', 'initiated', 'holding'].includes(status)) {
      return NextResponse.json(
        { success: false, message: `Purchase not in payable state (status=${purchase.status})` },
        { status: 409 }
      );
    }

    // 2) Load cleaner for display
    const cleaner = await Cleaner.findById(purchase.cleanerId);
    if (!cleaner) {
      return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
    }

    // 3) Determine amount (in pence). Prefer DB over client.
    const amountPence = Math.max(1, Math.round(Number(purchase.amountPence ?? purchase.amount ?? 299)));
    // normalize to pence if "amount" was stored as GBP
    const unit_amount =
      amountPence < 50 && Number(purchase.amount) > 0 && Number(purchase.amount) < 50
        ? Math.round(Number(purchase.amount) * 100)
        : amountPence;

    // 4) Reuse existing Checkout Session if still open (idempotence)
    if (purchase.checkoutSessionId) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(purchase.checkoutSessionId);
        if (existing?.status === 'open' && existing?.url) {
          return NextResponse.json({ success: true, url: existing.url });
        }
        // else: fall through to create a new session
      } catch (_) {
        // ignore and create a new session
      }
    }

    const sessionMetadata = {
      type: 'clientBooking',
      purchaseId: String(purchase._id),
      cleanerId: String(purchase.cleanerId),
      clientId: String(purchase.clientId),
      day: String(purchase.day || ''),
      hour: String(purchase.hour || ''),
      isoDate: String(purchase.isoDate || ''),
    };

    // 5) Create Checkout Session with manual capture
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // payment_method_types is optional on newer API versions; include if your project needs it:
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount,
            product_data: {
              name: `Unlock Cleaner Contact: ${cleaner.companyName || cleaner.realName || 'Cleaner'}`,
              description:
                `Access this cleaner's contact details and gallery. ` +
                (purchase.isoDate ? `Selected date: ${purchase.isoDate}. ` : '') +
                (purchase.day && purchase.hour
                  ? `Slot: ${purchase.day} ${String(purchase.hour).padStart(2, '0')}:00.`
                  : ''),
            },
          },
          quantity: 1,
        },
      ],
      metadata: sessionMetadata, // store identifiers
      payment_intent_data: {
        capture_method: 'manual', // allow capture on cleaner acceptance
        metadata: sessionMetadata,
      },
      client_reference_id: String(purchase._id),
      success_url: `${SITE_URL}/cleaners/${cleaner._id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/cleaners/${cleaner._id}?booking=cancelled`,
    });

    // 6) Persist session + PI IDs on the Purchase for webhook/acceptance
    try {
      // session.payment_intent can be string or object depending on API version
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;

      purchase.checkoutSessionId = session.id;
      if (paymentIntentId) purchase.paymentIntentId = paymentIntentId;
      // Keep a breadcrumb of amount (in pence) that we charged
      purchase.amountPence = unit_amount;
      await purchase.save();
    } catch (e) {
      // Not fatal for returning the URL; you should still persist soon after via webhook.
      console.warn('[Stripe] Failed to persist session/PI IDs onto purchase:', e?.message || e);
    }

    return NextResponse.json({ success: true, url: session.url });
  } catch (err) {
    console.error('❌ Stripe session creation failed:', err?.message || err);
    return NextResponse.json({ success: false, message: 'Checkout session failed' }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id'); // <-- matches success_url param above

  if (!sessionId) {
    return NextResponse.json({ success: false, message: 'Missing session_id' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({ success: true, session });
  } catch (err) {
    console.error('❌ Stripe session fetch failed:', err?.message || err);
    return NextResponse.json({ success: false, message: 'Failed to retrieve session' }, { status: 500 });
  }
}
