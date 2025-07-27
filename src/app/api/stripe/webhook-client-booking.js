import { buffer } from 'micro';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';

export const config = {
  api: {
    bodyParser: false, // Required for raw Stripe payload
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

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const metadata = session.metadata || {};

      console.log('📦 Webhook metadata:', metadata);

      if (
        session?.payment_intent &&
        metadata?.type === 'clientBooking' &&
        metadata.cleanerId &&
        metadata.clientId
      ) {
        await connectToDatabase();

        // 🛡️ Prevent duplicate insert
        const existing = await Purchase.findOne({
          cleanerId: metadata.cleanerId,
          clientId: metadata.clientId,
          stripeSessionId: session.id,
        });

        if (existing) {
          console.warn('⚠️ Duplicate purchase skipped for session:', session.id);
        } else {
          const newPurchase = await Purchase.create({
            clientId: metadata.clientId,
            cleanerId: metadata.cleanerId,
            stripeSessionId: session.id,
            paymentIntentId: session.payment_intent,
            amount: session.amount_total ? session.amount_total / 100 : null,
            status: 'pending_approval',
          });

          console.log('✅ Purchase saved:', newPurchase._id);
        }
      } else {
        console.error('❌ Missing or invalid metadata:', metadata);
      }
    }

    return res.status(200).send('Received');
  } catch (err) {
    console.error('❌ Unexpected webhook error:', err);
    return res.status(500).send('Unexpected server error');
  }
}
