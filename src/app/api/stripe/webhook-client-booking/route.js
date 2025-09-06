import Stripe from 'stripe';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';

export const config = {
  api: { bodyParser: false }, // pages API style; App Router ignores this but harmless
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ⛓️ Convert ReadableStream to Uint8Array (works in App Router)
async function getRawBody(readable) {
  const chunks = [];
  const reader = readable.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

export async function POST(req) {
  const sig = req.headers.get('stripe-signature');
  const rawBody = await getRawBody(req.body);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_CLIENT_BOOKING_SECRET
    );
  } catch (err) {
    console.error('❌ Stripe signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // We care about the Checkout completing so we can attach IDs to our existing Purchase
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const md = session.metadata || {};
    const piId = session.payment_intent || session.payment_intent_id || null;

    const {
      purchaseId,   // ✅ we passed this from the client
      clientId,
      cleanerId,
      day,
      hour,
    } = md;

    if (!purchaseId || !clientId || !cleanerId || !day || !hour) {
      console.error('❌ Missing metadata. Need purchaseId, clientId, cleanerId, day, hour.');
      return new Response('Missing required metadata', { status: 400 });
    }

    try {
      await connectToDatabase();

      // ⚠️ IMPORTANT: Update the existing Purchase created before Checkout
      const purchase = await Purchase.findById(purchaseId);
      if (!purchase) {
        // Fallback: don’t create a new one; just log (prevents duplicates/desync)
        console.warn('⚠️ Purchase not found by purchaseId. No new record created.', {
          purchaseId, sessionId: session.id,
        });
        return new Response('OK', { status: 200 });
      }

      // Attach Stripe IDs/amount; keep status as 'pending' (awaiting cleaner approval)
      purchase.stripeSessionId = session.id;
      if (piId) purchase.paymentIntentId = typeof piId === 'string' ? piId : String(piId);
      if (typeof session.amount_total === 'number') {
        purchase.amount = session.amount_total / 100;
      }
      // Keep whatever you used earlier: 'pending' is consistent with dashboards
      if (!purchase.status || purchase.status === 'pending_approval') {
        purchase.status = 'pending';
      }

      await purchase.save();

      return new Response('OK', { status: 200 });
    } catch (err) {
      console.error('❌ Webhook DB error:', err);
      return new Response('Database error', { status: 500 });
    }
  }

  // (Optional) handle other events (expired, payment_failed) if you want
  return new Response('Unhandled event', { status: 200 });
}
