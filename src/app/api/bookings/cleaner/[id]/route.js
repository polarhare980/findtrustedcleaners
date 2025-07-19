import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking'; // Ensure file is lowercase and matches schema
import { verifyToken } from '@/lib/auth'; // Assumes it returns user from JWT token

export async function GET(req, { params }) {
  await connectToDatabase();

  try {
    // 🔐 Verify the JWT token from cookie/header
    const user = await verifyToken(req);

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
    }

    // 🛡 Only allow cleaner or admin to fetch
    const isSelf = user.type === 'cleaner' && user._id.toString() === params.id;
    const isAdmin = user.type === 'admin';

    if (!isSelf && !isAdmin) {
      return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
    }

    // 📦 Fetch bookings by cleaner ID
    const bookings = await Booking.find({ cleanerId: params.id }).sort({ date: 1 });

    return NextResponse.json({ success: true, bookings });
  } catch (err) {
    console.error('❌ Fetch Cleaner Bookings Error:', err.message);
    return NextResponse.json({ success: false, message: 'Error fetching bookings' }, { status: 500 });
  }
}
