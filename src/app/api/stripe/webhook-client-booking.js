import { buffer } from 'micro';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';

export const config = {
  api: {
    bodyParser: false, // REQUIRED to prevent parsing of the raw Stripe payload
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let rawBody;
  const sig = req.headers['stripe-signature'];

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (
      session?.payment_intent &&
      session?.metadata?.clientBooking === 'true'
    ) {
      const { cleanerId, day, hour, clientId } = session.metadata;

      try {
        await connectToDatabase();

        const newPurchase = await Purchase.create({
          clientId: clientId || 'unknown',
          cleanerId,
          day,
          hour,
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
      console.error('❌ Missing or invalid metadata:', session);
    }
  }

  return res.status(200).json({ received: true });
}
