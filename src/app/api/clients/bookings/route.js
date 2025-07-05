import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import Cleaner from '@/models/Cleaner';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  await connectToDatabase();

  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
    }

    const user = await verifyToken(token);

    if (!user || user.type !== 'client') {
      return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
    }

    const bookings = await Booking.find({ clientId: user.id }).lean();

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