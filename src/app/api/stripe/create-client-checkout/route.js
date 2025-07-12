import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { cleanerId, day, hour } = await req.json();

    if (!cleanerId || !day || !hour) {
      return NextResponse.json({ error: 'Missing booking data' }, { status: 400 });
    }

    await connectToDatabase();
    const cleaner = await Cleaner.findById(cleanerId);
    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 });
    }

    const priceInPence = 299; // £2.99 to unlock

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Cleaner Booking - ${cleaner.realName}`,
              description: `${day} at ${hour}:00`,
            },
            unit_amount: priceInPence,
          },
          quantity: 1,
        },
      ],
      metadata: {
        cleanerId,
        clientBooking: 'true',
        day,
        hour,
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
