import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Convert ReadableStream to Buffer manually (App Router compatible)
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
      process.env.STRIPE_WEBHOOK_UPGRADE_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature validation failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (session.metadata?.cleanerId) {
      const cleanerId = session.metadata.cleanerId;

      try {
        await connectToDatabase();

        const updatedCleaner = await Cleaner.findByIdAndUpdate(
          cleanerId,
          { isPremium: true },
          { new: true }
        );

        if (updatedCleaner) {
          console.log('✅ Cleaner upgraded to premium:', updatedCleaner.email);
        } else {
          console.error('❌ Cleaner not found in DB');
        }
      } catch (err) {
        console.error('❌ DB error while upgrading cleaner:', err);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    } else {
      console.error('❌ No cleanerId found in metadata');
    }
  }

  return NextResponse.json({ received: true });
}
