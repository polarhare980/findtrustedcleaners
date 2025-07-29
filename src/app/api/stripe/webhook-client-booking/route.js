import Stripe from 'stripe';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';

export const config = {
  api: {
    bodyParser: false, // Required to verify Stripe signature
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ⛓️ Helper: Convert ReadableStream to Buffer
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

// 🚀 Main webhook handler
export async function POST(req) {
  console.log('🔥 WEBHOOK HIT: Booking webhook triggered');

  const sig = req.headers.get('stripe-signature');
  const rawBody = await getRawBody(req.body);

  console.log('📍 Stripe signature header:', sig);
  console.log('📦 Raw body length:', rawBody.length);
  console.log('🔧 Env check:');
  console.log('- STRIPE_SECRET_KEY:', !!process.env.STRIPE_SECRET_KEY);
  console.log('- STRIPE_WEBHOOK_CLIENT_BOOKING_SECRET:', !!process.env.STRIPE_WEBHOOK_CLIENT_BOOKING_SECRET);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_CLIENT_BOOKING_SECRET
    );
    console.log('✅ Stripe signature verified. Event type:', event.type);
  } catch (err) {
    console.error('❌ Signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Only act on checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};

    console.log('📦 Session metadata:', metadata);

    const { clientId, cleanerId } = metadata;
    if (!clientId || !cleanerId) {
      console.error('❌ Missing clientId or cleanerId in metadata');
      return new Response('Missing metadata', { status: 400 });
    }

    try {
      console.log('🔌 Connecting to MongoDB...');
      await connectToDatabase();
      console.log('✅ Connected to MongoDB');

      const clientObjectId = new mongoose.Types.ObjectId(clientId);
      const cleanerObjectId = new mongoose.Types.ObjectId(cleanerId);

      const existing = await Purchase.findOne({
        clientId: clientObjectId,
        cleanerId: cleanerObjectId,
        stripeSessionId: session.id,
      });

      if (existing) {
        console.log('ℹ️ Purchase already exists:', existing._id);
      } else {
        const newPurchase = await Purchase.create({
          clientId: clientObjectId,
          cleanerId: cleanerObjectId,
          stripeSessionId: session.id,
          paymentIntentId: session.payment_intent,
          amount: session.amount_total ? session.amount_total / 100 : null,
          status: 'pending_approval',
        });
        console.log('✅ New Purchase saved to DB:', newPurchase._id);
      }
    } catch (err) {
      console.error('❌ MongoDB Save Error:', err.message);
      return new Response('Database error', { status: 500 });
    }
  } else {
    console.log('🔕 Unhandled event type:', event.type);
  }

  return new Response('Webhook received', { status: 200 });
}
