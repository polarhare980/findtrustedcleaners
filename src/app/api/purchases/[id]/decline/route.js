import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase';
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
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) return json({ error: 'Purchase not found' }, 404);

    // Ownership
    if (String(purchase.cleanerId) !== String(user._id)) {
      return json({ error: 'You can only decline your own bookings.' }, 403);
    }

    // Only pending can be declined
    if (!['pending', 'pending_approval'].includes(purchase.status)) {
      return json({ error: `Only pending purchases can be declined (current: ${purchase.status}).` }, 409);
    }

    // Optional Stripe cleanup
    if (stripe) {
      try {
        // Prefer structured field
        let paymentIntentId = purchase?.stripe?.paymentIntentId || purchase?.paymentIntentId || null;

        // Derive PI from Checkout Session if needed
        if (!paymentIntentId) {
          const csId = purchase?.stripe?.checkoutSessionId || purchase?.stripeSessionId || null;
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
          const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

          // If not captured yet, cancel to release the authorisation/hold
          if (
            pi.status === 'requires_capture' ||
            pi.status === 'requires_payment_method' ||
            pi.status === 'requires_confirmation' ||
            pi.status === 'processing'
          ) {
            await stripe.paymentIntents.cancel(paymentIntentId);
          } else if (pi.status === 'succeeded') {
            // Edge case: already captured — issue a refund
            await stripe.refunds.create({ payment_intent: paymentIntentId });
          }
          // For other terminal states (canceled, etc.) no action required
        }
      } catch (err) {
        // We still proceed to decline, but surface a helpful message if desired.
        // To hard-fail instead, return a 402 here.
        console.warn('⚠️ Stripe cleanup on decline failed:', err?.message || err);
      }
    }

    // Update status -> declined
    purchase.status = 'declined';
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
    console.error('❌ Decline error:', err);
    return json({ error: 'Failed to decline booking' }, 500);
  }
}
