import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { cleanerId } = await req.json();

    if (!cleanerId) {
      return NextResponse.json({ error: 'Missing cleaner ID' }, { status: 400 });
    }

    await connectToDatabase();
    const cleaner = await Cleaner.findById(cleanerId);
    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 });
    }

    const priceInPence = 299; // £2.99

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Cleaner Contact Unlock - ${cleaner.realName}`,
              description: `Client is unlocking contact info`,
            },
            unit_amount: priceInPence,
          },
          quantity: 1,
        },
      ],
      metadata: {
        cleanerId,
        clientBooking: 'true',
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cleaner/${cleanerId}?booking=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cleaner/${cleanerId}?booking=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('❌ Booking Checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}


