import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import Cleaner from '@/models/Cleaner';
import { protectApiRoute } from '@/lib/auth';

export async function GET(req, { params }) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  const { id } = params;

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

export async function PUT(req, { params }) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  const { id } = params;
  const body = await req.json();

  const isSelf = user.type === 'cleaner' && user._id.toString() === id;
  const isAdmin = user.type === 'admin';

  if (!isSelf && !isAdmin) {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const updated = await Cleaner.findByIdAndUpdate(
      id,
      { $set: { availability: body.availability } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, cleaner: updated });
  } catch (err) {
    console.error('❌ Availability Update Error:', err.message);
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}
