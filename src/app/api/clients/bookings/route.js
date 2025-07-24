import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import Cleaner from '@/models/Cleaner';
import { NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/auth';

export async function GET(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  if (user.type !== 'client') {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const bookings = await Booking.find({ clientId: user._id }).lean();

    const detailedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const cleaner = await Cleaner.findById(booking.cleanerId);
        return {
          _id: booking._id,
          day: booking.day,
          time: booking.time,
          status: booking.status,
          cleanerName: cleaner ? cleaner.realName : 'Unknown Cleaner',
        };
      })
    );

    return NextResponse.json({ success: true, bookings: detailedBookings });
  } catch (err) {
    console.error('❌ Error fetching bookings:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
