import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking'; // ✅ Capitalized
import { verifyToken } from '@/lib/auth'; // ✅ Assumes it returns user from JWT

export async function GET(req, { params }) {
  await connectToDatabase();

  try {
    // 🔐 Validate JWT
    const user = await verifyToken(req); // ✅ Pass request to verifyToken

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
    }

    // ✅ Clean string comparison for IDs
    if (user.type !== 'cleaner' || user._id.toString() !== params.id) {
      return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
    }

    const bookings = await Booking.find({ cleanerId: params.id });

    return NextResponse.json({ success: true, bookings });
  } catch (err) {
    console.error('❌ Fetch Cleaner Bookings Error:', err.message);
    return NextResponse.json({ success: false, message: 'Error fetching bookings' }, { status: 500 });
  }
}
