import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { cleanerId } = await req.json();
    if (!cleanerId) {
      return NextResponse.json({ error: 'Missing cleanerId' }, { status: 400 });
    }

    await connectToDatabase();
    const cleaner = await Cleaner.findById(cleanerId);
    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 });
    }

    // Resolve or discover the Stripe Customer
    let customerId = cleaner.stripeCustomerId;
    if (!customerId) {
      // Try to find an existing customer by email (best-effort)
      const list = await stripe.customers.list({ email: cleaner.email, limit: 1 });
      if (list?.data?.[0]) {
        customerId = list.data[0].id;
        cleaner.stripeCustomerId = customerId;
        await cleaner.save();
      }
    }

    if (!customerId) {
      // Fallback: block, because we can’t open a portal without a customer
      return NextResponse.json(
        { error: 'No Stripe customer found for this cleaner. Please contact support.' },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.SITE_URL || 'https://www.findtrustedcleaners.com'}/cleaners/dashboard`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    console.error('❌ Portal error:', err);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
