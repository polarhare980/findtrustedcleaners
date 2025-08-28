import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  await connectToDatabase();

  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
    }

    const user = await verifyToken(token);

    if (!user || user.type !== 'client') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const { cleanerId, day, time, price } = await req.json();

    // ✅ Create booking in database with 'pending' status
    const newBooking = await Booking.create({
      cleanerId,
      clientId: user.id,
      day,
      time,
      status: 'pending',
    });

    // ✅ Create Stripe Payment Intent with delayed capture
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price * 100, // in pence
      currency: 'gbp',
      capture_method: 'manual', // ✅ Hold the funds
      metadata: {
        bookingId: newBooking._id.toString(),
        cleanerId: cleanerId,
        clientId: user.id,
      },
    });

    // ✅ Save PaymentIntent ID to the booking
    newBooking.stripePaymentIntentId = paymentIntent.id;
    await newBooking.save();

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret, // ✅ Send this to client for payment input
      bookingId: newBooking._id.toString(),
    });
  } catch (err) {
    console.error('❌ Stripe Payment Intent Error:', err.message);
    return NextResponse.json({ success: false, message: 'Stripe Payment Intent error' }, { status: 500 });
  }
}
