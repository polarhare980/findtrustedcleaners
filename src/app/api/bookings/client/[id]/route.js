import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking'; // ✅ Correct file name (lowercase)
import { protectRoute } from '@/lib/auth'; // ✅ Correct session middleware
import { NextResponse } from 'next/server';

// GET all bookings for a specific client (🔒 Protected)
export async function GET(req, { params }) {
  await connectToDatabase();

  // 🔐 Validate session with the same pattern as the rest of your app
  const { valid, user, response } = await protectRoute();
  if (!valid) return response;

  // ✅ Ensure only clients can view their own bookings (or admins)
  if (user.type !== 'client' || user._id !== params.id) {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const bookings = await Booking.find({ clientId: params.id }).lean();

    return NextResponse.json({ success: true, bookings }, { status: 200 });
  } catch (err) {
    console.error('❌ Fetch Client Bookings Error:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
