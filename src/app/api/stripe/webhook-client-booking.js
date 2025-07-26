import { buffer } from 'micro';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';

export const config = {
  api: {
    bodyParser: false, // REQUIRED for raw Stripe payload
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  let rawBody;

  try {
    rawBody = await buffer(req);
  } catch (err) {
    console.error('❌ Failed to read raw body:', err.message);
    return res.status(500).send('Error reading body');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_CLIENT_BOOKING_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};

    // 🧠 Confirm booking metadata is present
    if (
      session?.payment_intent &&
      metadata?.type === 'clientBooking' &&
      metadata.cleanerId &&
      metadata.clientId &&
      metadata.day &&
      metadata.hour
    ) {
      try {
        await connectToDatabase();

        const newPurchase = await Purchase.create({
          clientId: metadata.clientId,
          cleanerId: metadata.cleanerId,
          day: metadata.day,
          hour: metadata.hour,
          stripeSessionId: session.id,
          paymentIntentId: session.payment_intent,
          amount: session.amount_total ? session.amount_total / 100 : null,
          status: 'pending_approval',
        });

        console.log('✅ Booking recorded and pending approval:', newPurchase._id);
      } catch (err) {
        console.error('❌ Database error:', err);
        return res.status(500).send('Database error');
      }
    } else {
      console.error('❌ Missing booking metadata:', {
        cleanerId: metadata.cleanerId,
        clientId: metadata.clientId,
        day: metadata.day,
        hour: metadata.hour,
        sessionId: session.id,
      });
    }
  }

  return res.status(200).json({ received: true });
}
