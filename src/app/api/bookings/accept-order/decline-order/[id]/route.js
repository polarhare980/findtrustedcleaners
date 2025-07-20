import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import Cleaner from '@/models/Cleaner';
import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function PUT(req, { params }) {
  await connectToDatabase();
  const { id } = params;

  const { valid, user, response } = await protectRoute(req);
  if (!valid) return response;
  if (user.type !== 'cleaner') {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found.' }, { status: 404 });
    }

    if (booking.cleanerId.toString() !== user.id) {
      return NextResponse.json({ success: false, message: 'You can only decline your own bookings.' }, { status: 403 });
    }

    if (booking.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'Booking is not pending.' }, { status: 400 });
    }

    // ✅ Cancel the held payment
    await stripe.paymentIntents.cancel(booking.stripePaymentIntentId);

    // ✅ Update booking to declined
    booking.status = 'declined';
    await booking.save();

    // ✅ Free up cleaner availability
    const cleaner = await Cleaner.findById(booking.cleanerId);
    if (!cleaner.availability[booking.day]) cleaner.availability[booking.day] = {};
    cleaner.availability[booking.day][booking.time] = true;
    await cleaner.save();

    return NextResponse.json({
      success: true,
      message: 'Booking declined and payment cancelled.',
      booking,
      updatedAvailability: cleaner.availability,
    });
  } catch (err) {
    console.error('❌ Decline booking error:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
