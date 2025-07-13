import Stripe from 'stripe';
import { buffer } from 'micro';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';

export const config = {
  api: {
    bodyParser: false,
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
      process.env.STRIPE_WEBHOOK_SECRET
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
          clientId: session.customer_email || 'unknown', // You can enhance this later
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
      }
    }
  }

  return NextResponse.json({ received: true });
}

