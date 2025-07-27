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

  let rawBody;
  try {
    rawBody = await buffer(req);
  } catch (err) {
    console.error('❌ Failed to read raw body:', err.message);
    return res.status(500).send('Webhook body error');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_CLIENT_BOOKING_SECRET
    );
  } catch (err) {
    console.error('❌ Stripe webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Only handle successful session completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};

    console.log('📦 Webhook triggered with metadata:', metadata);

    if (
      session?.payment_intent &&
      metadata?.clientId &&
      metadata?.cleanerId
    ) {
      try {
        await connectToDatabase();

        // 🛡️ Prevent duplicates
        const existing = await Purchase.findOne({
          clientId: metadata.clientId,
          cleanerId: metadata.cleanerId,
          stripeSessionId: session.id,
        });

        if (existing) {
          console.warn('⚠️ Purchase already exists for this session:', session.id);
        } else {
          const newPurchase = await Purchase.create({
            clientId: metadata.clientId,
            cleanerId: metadata.cleanerId,
            stripeSessionId: session.id,
            paymentIntentId: session.payment_intent,
            amount: session.amount_total ? session.amount_total / 100 : null,
            status: 'pending_approval',
          });

          console.log('✅ Purchase inserted:', newPurchase._id);
        }
      } catch (err) {
        console.error('❌ Purchase insert failed:', err);
        return res.status(500).send('Database error');
      }
    } else {
      console.error('❌ Missing metadata in webhook:', metadata);
    }
  }

  return res.status(200).send('Webhook received');
}
