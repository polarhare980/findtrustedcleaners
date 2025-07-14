import Stripe from 'stripe';
import { buffer } from 'micro';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';

export const config = {
  api: {
    bodyParser: false, // ✅ Must be false for Stripe signature verification
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const rawBody = await buffer(req); // ✅ Use buffer instead of text
  const sig = req.headers.get('stripe-signature');

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

        console.log('✅ Cleaner upgraded to premium:', updatedCleaner._id);
      } catch (err) {
        console.error('❌ Failed to upgrade cleaner:', err);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    } else {
      console.error('❌ cleanerId not found in metadata');
    }
  }

  return NextResponse.json({ received: true });
}
