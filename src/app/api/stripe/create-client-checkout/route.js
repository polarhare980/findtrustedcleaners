import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import { protectRoute } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ POST: Create a new Stripe checkout session
export async function POST(req) {
  // 🔐 Check if user is logged in and a client
  const { valid, user, response } = await protectRoute(req);
  if (!valid || user?.type !== 'client') {
    return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
  }

  try {
    const { cleanerId, day, hour } = await req.json();

    if (!cleanerId) {
      return NextResponse.json({ error: 'Missing cleaner ID' }, { status: 400 });
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
            product_data: {
              name: `Unlock Cleaner Contact - ${cleaner.realName || 'Unknown Cleaner'}`,
              description: 'Client is purchasing access to contact details.',
            },
            unit_amount: priceInPence,
          },
          quantity: 1,
        },
      ],
      metadata: {
  type: 'clientBooking',                    // 🔑 webhook uses this to identify type
  cleanerId: cleanerId.toString(),          // ✅ Required for DB
  clientId: user._id.toString(),            // ✅ Required for DB
  day,                                      // ✅ Must be a string like 'Monday'
  hour                                      // ✅ Must be a string like '13'
},

      success_url: `${baseUrl}/clients/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cleaner/${cleanerId}?booking=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

// ✅ GET: Retrieve a Stripe session (optional)
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
    console.error('❌ Stripe session lookup failed:', err);
    return NextResponse.json({ success: false, message: 'Session lookup failed' }, { status: 500 });
  }
}
