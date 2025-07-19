import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking'; // Ensure this matches the schema name
import { protectRoute } from '@/lib/auth'; // ✅ Switched to protectRoute

export async function GET(req, { params }) {
  await connectToDatabase();

  const { valid, user, response } = await protectRoute(req);
  if (!valid) return response;

  const { id } = params;

  // ✅ Only allow access if it's the cleaner themselves or an admin
  const isSelf = user.type === 'cleaner' && user._id.toString() === id;
  const isAdmin = user.type === 'admin';

  if (!isSelf && !isAdmin) {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const bookings = await Booking.find({ cleanerId: id }).sort({ date: 1 });
    return NextResponse.json({ success: true, bookings });
  } catch (err) {
    console.error('❌ Fetch Cleaner Bookings Error:', err.message);
    return NextResponse.json({ success: false, message: 'Error fetching bookings' }, { status: 500 });
  }
}
