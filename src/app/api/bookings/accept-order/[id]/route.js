import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';
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

    const booking = await Purchase.findById(id);
    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found.' }, { status: 404 });
    }

    if (booking.cleanerId.toString() !== user._id.toString()) {
      return NextResponse.json({ success: false, message: 'You can only accept your own bookings.' }, { status: 403 });
    }

    if (booking.status !== 'pending') {
      return NextResponse.json({ success: false, message: 'Booking is not pending.' }, { status: 400 });
    }

    // ✅ Capture payment
    await stripe.paymentIntents.capture(booking.paymentIntentId);

    // ✅ Update booking
    booking.status = 'approved';
    await booking.save();

    // ✅ Update cleaner availability
    const cleaner = await Cleaner.findById(booking.cleanerId);
    if (!cleaner.availability[booking.day]) cleaner.availability[booking.day] = {};
    cleaner.availability[booking.day][booking.hour] = false;
    await cleaner.save();

    return NextResponse.json({
      success: true,
      message: 'Booking accepted and payment captured successfully.',
      booking,
      updatedAvailability: cleaner.availability
    });
  } catch (err) {
    console.error('❌ Booking acceptance error:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
