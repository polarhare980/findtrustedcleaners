// File: src/app/api/stripe/webhook/route.js
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Purchase from '@/models/Purchase';

export const runtime = 'nodejs';           // Ensure not on Edge (raw body required)
export const dynamic = 'force-dynamic';    // Avoid static optimization

// App Router uses req.text() for raw body, so bodyParser flag is not used here.
// (That flag was for the old Pages Router.)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  let event;

  try {
    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature');

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    // Only connect once we know the event is valid
    await connectToDatabase();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata || {};
        const mode = session.mode; // 'subscription' | 'payment' | 'setup'
        const amount = session.amount_total ? session.amount_total / 100 : null;

        // ---------- PREMIUM SUBSCRIPTION UPGRADE ----------
        // Trigger if:
        // - session.mode === 'subscription' AND we have a cleanerId
        //   (robust even if metadata.subscription is missing)
        if (metadata.cleanerId && mode === 'subscription') {
          await Cleaner.findByIdAndUpdate(
            metadata.cleanerId,
            {
              isPremium: true,
              stripeCustomerId: session.customer || null,
              stripeSubscriptionId: session.subscription || null,
              // Optional: track when premium started
              premiumSince: new Date(),
            },
            { new: true }
          );
          console.log(`✅ Cleaner ${metadata.cleanerId} marked as premium (mode=${mode})`);
        }

        // ---------- CLIENT BOOKING CHECKOUT ----------
        // Your previous logic keyed on metadata flags.
        if (
          metadata.clientBooking === 'true' &&
          metadata.cleanerId &&
          metadata.clientId
        ) {
          const newPurchase = await Purchase.create({
            cleanerId: metadata.cleanerId,
            clientId: metadata.clientId,
            paymentIntentId: session.payment_intent || null,
            stripeSessionId: session.id,
            amount,
            day: metadata.day || null,
            hour: metadata.hour || null,
            status: 'pending_approval',
          });

          console.log(
            `📅 Booking stored ${newPurchase._id} for cleaner ${metadata.cleanerId} on ${metadata.day} @ ${metadata.hour}:00`
          );
        }

        break;
      }

      // (Optional) Handle subscription life-cycle to auto-downgrade
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const subId = sub.id;

        if (subId) {
          const cleaner = await Cleaner.findOneAndUpdate(
            { stripeSubscriptionId: subId },
            { isPremium: false, premiumEndedAt: new Date() },
            { new: true }
          );
          if (cleaner) {
            console.log(`⚠️ Premium removed for cleaner ${cleaner._id} (subscription cancelled)`);
          }
        }
        break;
      }

      default:
        // No-op for other events
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error('❌ Webhook processing error:', err);
    // Always return 2xx to avoid Stripe retry storms if error is non-recoverable
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
