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
    // 1) Real bookings
    const bookings = await Booking.find({ cleanerId: id })
      .select('_id status day hour date cleanerId clientId')
      .sort({ date: 1 })
      .lean();

    // 2) Pending purchases (treat like pending bookings)
    //    Make sure your path/case matches the model file name.
    const { default: PurchaseModel } = await import('@/models/Purchase');
    const purchases = await PurchaseModel.find({
      cleanerId: id,
      status: 'pending',
    })
      .select('_id status day hour cleanerId clientId createdAt')
      .lean();

    // 3) Merge: only add purchases that aren’t already in bookings for same day/hour
    const hasKey = (d, h) => bookings.some(b => b.day === d && String(b.hour) === String(h));
    const purchaseAsBookings = purchases
      .filter(p => p.day && (p.hour !== undefined && p.hour !== null) && !hasKey(p.day, String(p.hour)))
      .map(p => ({
        _id: p._id,              // acts as bookingId for pending
        status: 'pending',
        day: p.day,
        hour: String(p.hour),
        cleanerId: p.cleanerId,
        clientId: p.clientId,
        date: p.createdAt,
        __from: 'purchase',      // handy flag for debugging
      }));

    const combined = [...bookings, ...purchaseAsBookings].sort((a, b) => {
      // sort by date if present, else day/hour
      if (a?.date && b?.date) return new Date(a.date) - new Date(b.date);
      if (a?.day === b?.day) return Number(a.hour) - Number(b.hour);
      return (a?.day || '').localeCompare(b?.day || '');
    });

    // DEBUG: see what we’re returning
    console.log('API /bookings/cleaner/:id →', {
      cleanerId: id,
      bookingsCount: bookings.length,
      purchasesPendingCount: purchases.length,
      combinedCount: combined.length,
      sample: combined.slice(0, 3).map(x => ({
        id: x._id, status: x.status, day: x.day, hour: String(x.hour), from: x.__from || 'booking'
      })),
    });

    return NextResponse.json({ success: true, bookings: combined });
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
