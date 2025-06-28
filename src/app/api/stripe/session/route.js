import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// ✅ Correctly use environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  await connectToDatabase();

  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
    }

    const user = verifyToken(token);

    if (!user || user.type !== 'client') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const { cleanerId, day, time, price } = await req.json();

    const newBooking = await Booking.create({
      cleanerId,
      clientId: user.id,
      day,
      time,
      status: 'pending',
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Cleaning on ${day} at ${time}:00`,
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `https://www.findtrustedcleaners.com/booking/confirmation`,
      cancel_url: `https://www.findtrustedcleaners.com/cleaners/${cleanerId}`,
      metadata: {
        bookingId: newBooking._id.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe Session Error:', err.message);
    return NextResponse.json({ success: false, message: 'Stripe session error' }, { status: 500 });
  }
}
