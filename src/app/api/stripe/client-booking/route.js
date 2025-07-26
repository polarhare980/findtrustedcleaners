import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';

export const config = {
  api: {
    bodyParser: false, // Required for Stripe raw body verification
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Convert ReadableStream to Buffer (App Router compatible)
async function getRawBody(readable) {
  const reader = readable.getReader();
  let result = new Uint8Array();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const combined = new Uint8Array(result.length + value.length);
    combined.set(result);
    combined.set(value, result.length);
    result = combined;
  }
  return result;
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
    console.error('❌ Webhook signature failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (
      session?.payment_intent &&
      session?.metadata?.clientBooking === 'true'
    ) {
      const { cleanerId, day, hour, clientId } = session.metadata;

      try {
        await connectToDatabase();

        const newPurchase = await Purchase.create({
          clientId: clientId || 'unknown',
          cleanerId,
          day,
          hour,
          stripeSessionId: session.id,
          paymentIntentId: session.payment_intent,
          amount: session.amount_total ? session.amount_total / 100 : null,
          status: 'pending_approval',
        });

        console.log('✅ Booking recorded and pending approval:', newPurchase._id);
      } catch (err) {
        console.error('❌ Failed to record booking:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
    } else {
      console.error('❌ Missing or invalid metadata:', session);
    }
  }

  return NextResponse.json({ received: true });
}
