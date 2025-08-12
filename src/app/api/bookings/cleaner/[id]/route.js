import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
// ⚠️ Make sure the filename matches the case on disk:
// if your model file is "Booking.js", import from '@/models/Booking'
import Booking from '@/models/booking';
import Cleaner from '@/models/Cleaner';
import { protectApiRoute } from '@/lib/auth';

export async function GET(req, { params }) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  const { id } = params;

  const isSelf = user.type === 'cleaner' && String(user._id) === String(id);
  const isAdmin = user.type === 'admin';
  if (!isSelf && !isAdmin) {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    // Pull the fields we actually need; lean() so logs/JSON are clean
    const bookings = await Booking.find({ cleanerId: id })
      .select('_id status day hour date cleanerId clientId')
      .sort({ date: 1 })
      .lean();

    // 🔎 TEMP DEBUG
    console.log('API /bookings/cleaner/:id →', {
      cleanerId: id,
      count: bookings?.length || 0,
      pendingCount: bookings?.filter(b => b?.status === 'pending').length || 0,
      sample: (bookings || []).slice(0, 3).map(b => ({
        id: b?._id,
        status: b?.status,
        day: b?.day,
        hour: String(b?.hour),
        cleanerId: b?.cleanerId,
      })),
    });

    return NextResponse.json({ success: true, bookings });
  } catch (err) {
    console.error('❌ Fetch Cleaner Bookings Error:', err);
    return NextResponse.json({ success: false, message: 'Error fetching bookings' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  const { id } = params;
  const body = await req.json();

  const isSelf = user.type === 'cleaner' && String(user._id) === String(id);
  const isAdmin = user.type === 'admin';
  if (!isSelf && !isAdmin) {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const updated = await Cleaner.findByIdAndUpdate(
      id,
      { $set: { availability: body.availability } },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
    }

    // 🔎 TEMP DEBUG
    console.log('API update availability →', {
      cleanerId: id,
      hasAvailability: !!updated?.availability,
    });

    return NextResponse.json({ success: true, cleaner: updated });
  } catch (err) {
    console.error('❌ Availability Update Error:', err);
    return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
  }
}
