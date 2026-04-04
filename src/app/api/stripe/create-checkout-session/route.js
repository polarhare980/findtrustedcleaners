import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const SITE_URL = process.env.SITE_URL || 'https://www.findtrustedcleaners.com';
const YEARLY_PREMIUM_FALLBACK_PENCE = 50;

export async function POST(req) {
  try {
    const { cleanerId } = await req.json();

    if (!cleanerId) {
      return NextResponse.json({ error: 'Missing cleanerId' }, { status: 400 });
    }

    const successUrl = `${SITE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${SITE_URL}/payment-cancelled`;

    const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID_YEARLY || process.env.STRIPE_PREMIUM_PRICE_ID;
    const useRecurringPrice = Boolean(process.env.STRIPE_PREMIUM_PRICE_ID_YEARLY);

    const lineItem = premiumPriceId
      ? { price: premiumPriceId, quantity: 1 }
      : {
          price_data: {
            currency: 'gbp',
            unit_amount: YEARLY_PREMIUM_FALLBACK_PENCE,
            product_data: {
              name: 'Find Trusted Cleaners Premium',
              description: 'Premium cleaner listing upgrade',
            },
          },
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create({
      mode: useRecurringPrice ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [lineItem],
      metadata: { cleanerId, premiumUpgrade: 'true', premiumPlan: useRecurringPrice ? 'yearly_recurring' : 'yearly_manual' },
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
