import Stripe from 'stripe';
import { buffer } from 'micro';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';

export const config = {
  api: {
    bodyParser: false, // Required for raw body parsing with Stripe
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const rawBody = await req.text(); // Read the raw body
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_CLIENT_BOOKING_SECRET // use dedicated secret for this webhook route
    );
  } catch (err) {
    console.error('❌ Webhook signature failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (
      session?.payment_intent &&
      session.metadata?.clientBooking === 'true'
    ) {
      const { cleanerId, day, hour } = session.metadata;

      try {
        await connectToDatabase();

        const newPurchase = await Purchase.create({
          clientId: session.customer_email || 'unknown',
          cleanerId,
          day,
          hour,
          stripeSessionId: session.id,
          paymentIntentId: session.payment_intent,
          status: 'pending_approval',
        });

        console.log('✅ Booking recorded and pending approval:', newPurchase._id);
      } catch (err) {
        console.error('❌ Failed to record booking:', err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
