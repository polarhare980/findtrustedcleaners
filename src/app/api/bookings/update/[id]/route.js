import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function PUT(req, { params }) {
  await connectToDatabase();

  try {
    // ✅ Verify user session
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    const user = verifyToken(token);

    if (!user || user.type !== 'cleaner') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    const { status } = await req.json();

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status value' }, { status: 400 });
    }

    // ✅ Update booking status (accept or reject)
    const updatedBooking = await Booking.findByIdAndUpdate(
      params.id,
      { status },
      { new: true }
    );

    if (!updatedBooking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ message: `Booking ${status} successfully`, booking: updatedBooking }, { status: 200 });
  } catch (err) {
    console.error('❌ Booking Update Error:', err.message);
    return NextResponse.json({ message: 'Error updating booking' }, { status: 500 });
  }
}
