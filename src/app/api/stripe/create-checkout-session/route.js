import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { cleanerId } = await req.json();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PREMIUM_PRICE_ID, // ← set this in Stripe dashboard
          quantity: 1,
        },
      ],
      metadata: {
        cleanerId, // we’ll use this later in webhook
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe session error:', err);
    return NextResponse.json({ error: 'Failed to create Stripe session' }, { status: 500 });
  }
}
