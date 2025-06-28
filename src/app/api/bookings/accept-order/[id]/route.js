import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function PUT(req, { params }) {
  await connectToDatabase();
  const { id } = params;

  try {
    // ✅ Extract and verify JWT token from cookie
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
    }

    const user = verifyToken(token);

    if (!user || user.type !== 'cleaner') {
      return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
    }

    // ✅ Update booking status to accepted
    const updatedBooking = await Booking.findByIdAndUpdate(id, {
      status: 'accepted',
      acceptedBy: user.id,
    }, { new: true });

    if (!updatedBooking) {
      return NextResponse.json({ success: false, message: 'Booking not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Order accepted.', booking: updatedBooking });
  } catch (err) {
    console.error('❌ Booking acceptance error:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
