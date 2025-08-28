import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import Cleaner from '@/models/Cleaner';
import { NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function PUT(req, { params }) {
  await connectToDatabase();
  const { id } = params;

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  if (user.type !== 'cleaner') {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found.' }, { status: 404 });
    }

    if (String(booking.cleanerId) !== String(user._id)) {
      return NextResponse.json({ success: false, message: 'You can only decline your own bookings.' }, { status: 403 });
    }

    if (booking.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'Booking is not pending.' }, { status: 400 });
    }

    // ✅ Cancel the held payment (if any)
    if (booking.paymentIntentId) {
      try {
        await stripe.paymentIntents.cancel(booking.paymentIntentId);
      } catch (err) {
        console.error('❌ Stripe cancel error:', err);
        return NextResponse.json({ success: false, message: 'Payment cancel failed.' }, { status: 402 });
      }
    }

    // ✅ Update booking to declined
    booking.status = 'declined';
    await booking.save();

    // 🔄 Do NOT mutate base availability here; overlay will clear pending automatically
    const cleaner = await Cleaner.findById(booking.cleanerId).lean();
    const updatedAvailability = cleaner?.availability || {};

    return NextResponse.json({
      success: true,
      message: 'Booking declined and payment cancelled.',
      booking,
      updatedAvailability,
    });
  } catch (err) {
    console.error('❌ Decline booking error:', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
