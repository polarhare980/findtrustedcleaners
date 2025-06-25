import dbConnect from '@/lib/dbConnect';
import Cleaner from '@/models/cleaner';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Disable Next.js's default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  await dbConnect();

  const buf = await req.arrayBuffer();
  const rawBody = Buffer.from(buf).toString();

  const sig = req.headers.get('stripe-signature');
  const endpointSecret = 'whsec_XXXXXXXXXXXXXXXXXXXX'; // Replace with your actual webhook secret from Stripe

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Stripe Webhook Error:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // ✅ Handle successful subscription payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const cleanerId = session.metadata.cleanerId;

    try {
      await Cleaner.findByIdAndUpdate(cleanerId, { premium: true });
      console.log(`✅ Cleaner ${cleanerId} upgraded to Premium`);
    } catch (err) {
      console.error('❌ Failed to upgrade cleaner:', err.message);
    }
  }

  return NextResponse.json({ received: true });
}
