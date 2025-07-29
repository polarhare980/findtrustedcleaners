import Stripe from 'stripe';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

export async function POST(req) {
  console.log('🔥 WEBHOOK HIT');

  const sig = req.headers.get('stripe-signature');
  const rawBody = await getRawBody(req.body);

  console.log('📍 Raw body received. Length:', rawBody.length);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_CLIENT_BOOKING_SECRET
    );
    console.log('✅ Stripe signature verified.');
  } catch (err) {
    console.error('❌ Signature verification failed:', err.message);
    console.error('📍 Signature:', sig);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    console.log('🎯 Event type: checkout.session.completed');
    const session = event.data.object;
    const metadata = session.metadata || {};

    console.log('📦 Metadata:', metadata);

    if (!metadata.clientId || !metadata.cleanerId) {
      console.error('❌ Missing required metadata.');
      return new Response('Missing metadata', { status: 400 });
    }

    try {
      console.log('🔌 Connecting to MongoDB...');
      await connectToDatabase();
      console.log('✅ MongoDB connected.');

      const clientId = new mongoose.Types.ObjectId(metadata.clientId);
      const cleanerId = new mongoose.Types.ObjectId(metadata.cleanerId);

      const existing = await Purchase.findOne({
        clientId,
        cleanerId,
        stripeSessionId: session.id,
      });

      if (existing) {
        console.log('ℹ️ Purchase already exists:', existing._id);
      } else {
        const newPurchase = await Purchase.create({
          clientId,
          cleanerId,
          stripeSessionId: session.id,
          paymentIntentId: session.payment_intent,
          amount: session.amount_total ? session.amount_total / 100 : null,
          status: 'pending_approval',
        });

        console.log('✅ New Purchase saved:', newPurchase._id);
      }
    } catch (err) {
      console.error('❌ DB Save Error:', err);
      return new Response('DB Save Error', { status: 500 });
    }
  } else {
    console.log('🔕 Ignored event type:', event.type);
  }

  return new Response('Webhook received', { status: 200 });
}
