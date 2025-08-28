import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  await connectToDatabase();

  try {
    // ✅ Verify user token
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
    }

    const user = await verifyToken(token);

    if (!user || user.type !== 'cleaner') {
      return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Premium Cleaner Profile',
            },
            unit_amount: 799, // £7.99 in pennies
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `https://www.findtrustedcleaners.com/cleaner/upgrade-success`,
      cancel_url: `https://www.findtrustedcleaners.com/cleaner/upgrade-cancelled`,
      metadata: {
        cleanerId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Proceed to payment.',
      checkoutUrl: session.url,
    });
  } catch (err) {
    console.error('❌ Subscription creation error:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
