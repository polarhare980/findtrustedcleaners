import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { cleanerId } = await req.json();

    // 🧪 Step 1: Log the env var and constructed URLs
console.log('✅ SITE_URL env:', process.env.SITE_URL);

const successUrl = `${process.env.SITE_URL}/dashboard?success=true`;
const cancelUrl = `${process.env.SITE_URL}/dashboard?canceled=true`;

console.log('✅ Final success URL:', successUrl);
console.log('✅ Final cancel URL:', cancelUrl);

// 👇 Stripe session call
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [
    {
      price: process.env.STRIPE_PREMIUM_PRICE_ID,
      quantity: 1,
    },
  ],
  metadata: { cleanerId },
  success_url: successUrl,
  cancel_url: cancelUrl,
});


    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe session error:', err);
    return NextResponse.json({ error: 'Failed to create Stripe session' }, { status: 500 });
  }
}
