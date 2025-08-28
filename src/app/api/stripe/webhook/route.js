import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Purchase from '@/models/Purchase';

export const config = {
  api: {
    bodyParser: false, // Required for Stripe signature verification
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // 🧠 Use your unified webhook secret if handling both cases
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};
    const paymentIntentId = session.payment_intent;
    const amount = session.amount_total ? session.amount_total / 100 : null;

    try {
      await connectToDatabase();

      // ✅ 1. Handle Premium Cleaner Subscription
      if (metadata.cleanerId && metadata.subscription === 'true') {
        await Cleaner.findByIdAndUpdate(metadata.cleanerId, { isPremium: true });
        console.log(`✅ Cleaner ${metadata.cleanerId} marked as premium`);
      }

      // ✅ 2. Handle Client Booking Payment
      if (metadata.cleanerId && metadata.clientId && metadata.clientBooking === 'true') {
        const newPurchase = await Purchase.create({
          cleanerId: metadata.cleanerId,
          clientId: metadata.clientId,
          paymentIntentId,
          stripeSessionId: session.id,
          amount,
          day: metadata.day || null,
          hour: metadata.hour || null,
          status: 'pending_approval',
        });

        console.log(`📅 Booking stored: ${newPurchase._id} for ${metadata.day} at ${metadata.hour}:00`);
      }

    } catch (err) {
      console.error('❌ Webhook DB error:', err);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
