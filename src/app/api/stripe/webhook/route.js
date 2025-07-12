// 📌 Webhook temporarily removed for deployment.
// Final run-through must include the Stripe webhook to handle subscription confirmation and booking payments.
// 
// ✅ Cleaner Subscription Webhook:
// Required to mark cleaner profiles as premium after successful £7.99/month payment.
// Route: /src/app/api/stripe/webhook/route.js
//
// ✅ Booking Payment Webhook:
// Required to unlock full cleaner profiles after client payment for a specific booking.
//
// 🚧 Current Status:
// - Stripe subscription flow is built and working.
// - Cleaner upgrade checkout session is working.
// - Webhook removed for deployment compatibility.
// - Client-side redirects to Stripe pending.
// - Paywall logic pending.
//
// 🔔 Final Checklist:
// - Reinstate this webhook.
// - Complete booking payment webhook.
// - Verify premium status updates in Cleaner Dashboard.rodger
// - Implement paywall and client-side redirects.

import Stripe from 'stripe';
import { buffer } from 'micro';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Purchase from '@/models/Purchase';

export const config = {
  api: {
    bodyParser: false, // Needed for raw Stripe signature verification
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
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};
    const paymentIntentId = session.payment_intent;

    try {
      await connectToDatabase();

      // ✅ Cleaner Subscription Upgrade
      if (metadata.cleanerId && metadata.subscription === 'true') {
        await Cleaner.findByIdAndUpdate(metadata.cleanerId, { isPremium: true });
        console.log(`✅ Cleaner ${metadata.cleanerId} marked as premium`);
      }

      // ✅ Client Booking Payment (manual capture pending approval)
      if (metadata.cleanerId && metadata.clientBooking === 'true') {
        const { cleanerId, day, hour } = metadata;

        await Purchase.create({
          cleaner: cleanerId,
          client: session.customer_email,
          paymentIntentId,
          day,
          hour,
          status: 'pending',
        });

        console.log(`📅 Booking stored for ${day} ${hour}:00 — waiting cleaner approval`);
      }
    } catch (err) {
      console.error('❌ Webhook DB error:', err);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
