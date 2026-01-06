import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { cleanerId } = await req.json();

    if (!cleanerId) {
      return NextResponse.json({ error: 'Missing cleanerId' }, { status: 400 });
    }

    const successUrl = `${process.env.SITE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.SITE_URL}/payment-cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      // ✅ Add a robust breadcrumb for your webhook
      metadata: { cleanerId, subscription: 'true' },
      // Optional: also set client_reference_id for redundancy/debugging
      client_reference_id: cleanerId,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe session error:', err);
    return NextResponse.json({ error: 'Failed to create Stripe session' }, { status: 500 });
  }
}
