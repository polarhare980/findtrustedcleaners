import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import { protectRoute } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ POST: Create Stripe Checkout Session (no day/hour metadata)
export async function POST(req) {
  const { valid, user, response } = await protectRoute(req);

  if (!valid || user?.type !== 'client') {
    return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
  }

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

    const priceInPence = 299; // £2.99
    const baseUrl = process.env.SITE_URL || 'https://www.findtrustedcleaners.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: priceInPence,
            product_data: {
              name: `Unlock Cleaner Contact: ${cleaner.realName || 'Cleaner'}`,
              description: `Access cleaner's contact details and gallery.`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'clientBooking',
        cleanerId: cleaner._id.toString(),
        clientId: user._id.toString(),
      },
      success_url: `${baseUrl}/cleaners/${cleanerId}?payment=success`,
      cancel_url: `${baseUrl}/cleaners/${cleanerId}?booking=cancelled`,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (err) {
    console.error('❌ Stripe session error:', err);
    return NextResponse.json({ success: false, message: 'Checkout session failed' }, { status: 500 });
  }
}

// ✅ GET: Retrieve Stripe session by ID (unchanged)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ success: false, message: 'Missing session_id' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({ success: true, session });
  } catch (err) {
    console.error('❌ Stripe session fetch failed:', err);
    return NextResponse.json({ success: false, message: 'Failed to retrieve session' }, { status: 500 });
  }
}
