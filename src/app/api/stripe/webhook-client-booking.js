import { buffer } from 'micro';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const rawBody = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_CLIENT_BOOKING_SECRET
    );
  } catch (err) {
    console.error('❌ Stripe signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};

    console.log('✅ Webhook metadata:', metadata);

    if (metadata.clientId && metadata.cleanerId) {
      try {
        await connectToDatabase();

        const existing = await Purchase.findOne({
          clientId: metadata.clientId,
          cleanerId: metadata.cleanerId,
          stripeSessionId: session.id,
        });

        if (!existing) {
          const newPurchase = await Purchase.create({
            clientId: metadata.clientId,
            cleanerId: metadata.cleanerId,
            stripeSessionId: session.id,
            paymentIntentId: session.payment_intent,
            amount: session.amount_total ? session.amount_total / 100 : null,
            status: 'pending_approval',
          });

          console.log('✅ Purchase created:', newPurchase._id);
        }
      } catch (err) {
        console.error('❌ DB insert failed:', err);
        return res.status(500).send('Database error');
      }
    } else {
      console.error('❌ Missing metadata');
    }
  }

  return res.status(200).send('Webhook received');
}
