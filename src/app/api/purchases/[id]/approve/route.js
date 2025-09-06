import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export async function PUT(req, { params }) {
  await connectToDatabase();
  const purchaseId = params?.id;

  // Auth
  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;
  if (user.type !== 'cleaner') return json({ error: 'Forbidden' }, 403);

  // Validate id
  if (!mongoose.Types.ObjectId.isValid(String(purchaseId))) {
    return json({ error: 'Invalid purchase id' }, 400);
  }

  try {
    // Load purchase
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) return json({ error: 'Purchase not found' }, 404);

    // Ownership check
    if (String(purchase.cleanerId) !== String(user._id)) {
      return json({ error: 'You can only accept your own bookings.' }, 403);
    }

    // Must be pending
    if (!['pending', 'pending_approval'].includes(purchase.status)) {
      return json({ error: `Only pending purchases can be accepted (current: ${purchase.status}).` }, 409);
    }

    // Sanity: cleaner still exists
    const cleaner = await Cleaner.findById(purchase.cleanerId).select('_id').lean();
    if (!cleaner) return json({ error: 'Cleaner not found.' }, 404);

    // Optional Stripe capture (manual-capture flow)
    if (stripe) {
      try {
        // Prefer structured field
        let paymentIntentId = purchase?.stripe?.paymentIntentId || purchase?.paymentIntentId || null;

        // If only a Checkout Session is stored, derive PI from it
        if (!paymentIntentId) {
          const csId =
            purchase?.stripe?.checkoutSessionId ||
            purchase?.stripeSessionId ||
            null;
          if (csId) {
            const session = await stripe.checkout.sessions.retrieve(csId);
            if (session?.payment_intent) {
              paymentIntentId =
                typeof session.payment_intent === 'string'
                  ? session.payment_intent
                  : session.payment_intent?.id;
            }
          }
        }

        if (paymentIntentId) {
          await stripe.paymentIntents.capture(paymentIntentId);
        }
      } catch (err) {
        // If it's already captured, Stripe might throw unexpected_state; surface others
        const code = err?.raw?.code || '';
        if (code !== 'payment_intent_unexpected_state') {
          console.error('❌ Stripe capture error:', err);
          return json({ error: 'Payment capture failed' }, 402);
        }
      }
    }

    // Mark purchase accepted (do NOT mutate cleaner.availability; UI reads from purchases feed)
    purchase.status = 'accepted';
    await purchase.save();

    return json({
      success: true,
      purchase: {
        _id: String(purchase._id),
        status: purchase.status,
        cleanerId: String(purchase.cleanerId),
        clientId: String(purchase.clientId),
        day: purchase.day,
        hour: purchase.hour,
        span: purchase.span,
        serviceKey: purchase.serviceKey,
        serviceName: purchase.serviceName || '',
        durationMins: purchase.durationMins,
        bufferBeforeMins: purchase.bufferBeforeMins || 0,
        bufferAfterMins: purchase.bufferAfterMins || 0,
        amount: purchase.amount,
        currency: purchase.currency || 'GBP',
        createdAt: purchase.createdAt,
        updatedAt: purchase.updatedAt,
      },
    });
  } catch (err) {
    console.error('❌ Accept error:', err);
    return json({ error: 'Failed to accept booking' }, 500);
  }
}
