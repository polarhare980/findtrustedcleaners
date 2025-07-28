import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';
import { NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// App Router-friendly raw body reader
async function getRawBody(readable) {
  const reader = readable.getReader();
  let result = new Uint8Array();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const combined = new Uint8Array(result.length + value.length);
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
    console.error('❌ Signature verification failed:', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};

    console.log('📦 Webhook fired with metadata:', metadata);

    if (metadata.clientId && metadata.cleanerId) {
      try {
        await connectToDatabase();

        const existing = await Purchase.findOne({
          clientId: metadata.clientId,
          cleanerId: metadata.cleanerId,
          stripeSessionId: session.id,
        });

        if (!existing) {
          const newPurchase = await Purchase.create({
            clientId: metadata.clientId,
            cleanerId: metadata.cleanerId,
            stripeSessionId: session.id,
            paymentIntentId: session.payment_intent,
            amount: session.amount_total ? session.amount_total / 100 : null,
            status: 'pending_approval',
          });

          console.log('✅ Purchase inserted:', newPurchase._id);
        }
      } catch (err) {
        console.error('❌ DB insert failed:', err);
        return new NextResponse('DB insert error', { status: 500 });
      }
    } else {
      console.error('❌ Missing metadata:', metadata);
    }
  }

  return new NextResponse('OK', { status: 200 });
}

