import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import { protectApiRoute } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET all bookings for a specific client (🔒 Protected)
export async function GET(req, { params }) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  // ✅ Ensure only clients can view their own bookings (or admins)
  const isSelf = user.type === 'client' && user._id === params.id;
  const isAdmin = user.type === 'admin';

  if (!isSelf && !isAdmin) {
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
