import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import Cleaner from '@/models/Cleaner';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function PUT(req, { params }) {
  await connectToDatabase();
  const { id } = params;

  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
    }

    const user = await verifyToken(token);

    if (!user || user.type !== 'cleaner') {
      return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found.' }, { status: 404 });
    }

    if (booking.cleanerId.toString() !== user.id) {
      return NextResponse.json({ success: false, message: 'You can only clear your own bookings.' }, { status: 403 });
    }

    if (booking.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'Booking is not pending.' }, { status: 400 });
    }

    // ✅ Cancel the held payment
    await stripe.paymentIntents.cancel(booking.stripePaymentIntentId);

    // ✅ Update booking to 'cleared' or 'cancelled'
    booking.status = 'cleared';
    await booking.save();

    // ✅ Free up the slot
    const cleaner = await Cleaner.findById(booking.cleanerId);
    if (!cleaner.availability[booking.day]) cleaner.availability[booking.day] = {};
    cleaner.availability[booking.day][booking.time] = true; // Mark as available
    await cleaner.save();

    return NextResponse.json({
      success: true,
      message: 'Pending slot cleared successfully.',
    });
  } catch (err) {
    console.error('❌ Clear pending error:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
