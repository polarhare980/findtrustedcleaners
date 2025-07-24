import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import Cleaner from '@/models/Cleaner';
import { NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// ✅ Create a new booking (Client only)
export async function POST(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  if (user.type !== 'client') {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const { cleanerId, day, time, stripePaymentIntentId } = await req.json();

    if (!cleanerId || !day || !time || !stripePaymentIntentId) {
      return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }

    // ✅ Lookup cleaner name
    const cleaner = await Cleaner.findById(cleanerId);
    if (!cleaner) {
      return NextResponse.json({ success: false, message: 'Cleaner not found.' }, { status: 404 });
    }

    // ✅ Create booking
    const newBooking = await Booking.create({
      clientId: user._id,
      cleanerId,
      day,
      time,
      stripePaymentIntentId,
      status: 'pending',
      createdAt: new Date(),
    });

    // ✅ Set cleaner as pending
    await Cleaner.updateOne(
      { _id: new ObjectId(cleanerId) },
      { $set: { pending: true } }
    );

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully.',
      booking: newBooking,
      cleanerName: cleaner.realName,
      slotDay: day,
      slotTime: time,
    });
  } catch (err) {
    console.error('❌ Booking creation error:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ✅ Optional: Get all bookings (e.g. for admin panel)
export async function GET() {
  await connectToDatabase();

  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, bookings });
  } catch (err) {
    console.error('❌ Fetch bookings error:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
