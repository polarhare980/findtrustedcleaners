import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import { protectRoute } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const { valid, user, response } = await protectRoute(req);
  if (!valid || user?.type !== 'client') {
    return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { cleanerId, day, hour, purchaseId } = body; // <-- accept purchaseId from client

    if (!cleanerId || !day || !hour || !purchaseId) {
      return NextResponse.json(
        { success: false, error: 'Missing cleanerId, day, hour or purchaseId' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const cleaner = await Cleaner.findById(cleanerId);
    if (!cleaner) {
      return NextResponse.json({ success: false, error: 'Cleaner not found' }, { status: 404 });
    }

    // Store essential info so webhooks/return pages can tie payment -> Purchase
    const sessionMetadata = {
      type: 'clientBooking',
      purchaseId,
      cleanerId: cleaner._id.toString(),
      clientId: user._id.toString(),
      day,
      hour,
    };

    // Create Checkout Session, with manual capture on the underlying PaymentIntent
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: 299, // £2.99
            product_data: {
              name: `Unlock Cleaner Contact: ${cleaner.realName || cleaner.companyName || 'Cleaner'}`,
              description: `Access the cleaner's contact details and gallery.`,
            },
          },
          quantity: 1,
        },
      ],
      // Put data both places: some flows read from PI, some from Session
      metadata: sessionMetadata,
      payment_intent_data: {
        capture_method: 'manual', // <-- critical for approve/capture later
        metadata: sessionMetadata,
      },
      client_reference_id: purchaseId, // handy for dashboard/debug
      success_url: `${process.env.SITE_URL || 'https://www.findtrustedcleaners.com'}/cleaners/${cleanerId}?payment=success&sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL || 'https://www.findtrustedcleaners.com'}/cleaners/${cleanerId}?booking=cancelled`,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (err) {
    console.error('❌ Stripe session creation failed:', err?.message || err);
    return NextResponse.json({ success: false, message: 'Checkout session failed' }, { status: 500 });
  }
}

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
    console.error('❌ Stripe session fetch failed:', err?.message || err);
    return NextResponse.json({ success: false, message: 'Failed to retrieve session' }, { status: 500 });
  }
}

