// app/api/bookings/[id]/status.js
import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import { protectApiRoute } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function PATCH(req, { params }) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid || user.type !== 'cleaner') return response;

  const bookingId = params.id;
  const { status } = await req.json();

  if (!bookingId || !['accepted', 'rejected'].includes(status)) {
    return NextResponse.json({ success: false, message: 'Invalid booking ID or status' }, { status: 400 });
  }

  try {
    const booking = await Booking.findOne({
      _id: new ObjectId(bookingId),
      cleanerId: new ObjectId(user._id),
    });

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    booking.status = status;
    await booking.save();

    return NextResponse.json({ success: true, message: `Booking ${status}.` });
  } catch (err) {
    console.error('❌ Booking status update failed:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
