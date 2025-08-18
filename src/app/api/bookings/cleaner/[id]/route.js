import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Cleaner from '@/models/Cleaner';

// ⚠️ Ensure model filename/case matches your filesystem: "Booking.js"
import Booking from '@/models/booking';
import Purchase from '@/models/Purchase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const HOURS = Array.from({ length: 13 }, (_, i) => String(7 + i)); // "7".."19"

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function isObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id));
}

/* ------------------------------- GET (list) ------------------------------- */
/**
 * Returns the cleaner’s bookings plus span-aware pending/accepted purchases,
 * shaped to a single list for dashboard use.
 */
export async function GET(req, { params }) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  const cleanerId = params?.id;
  const isSelf = user.type === 'cleaner' && String(user._id) === String(cleanerId);
  const isAdmin = user.type === 'admin';
  if (!isSelf && !isAdmin) return json({ success: false, message: 'Access denied.' }, 403);

  if (!isObjectId(cleanerId)) return json({ success: false, message: 'Invalid cleaner id.' }, 400);

  try {
    // 1) Real bookings (if you have a separate model for confirmed jobs)
    //    We allow span (default 1) for consistency.
    const bookings = await Booking.find({ cleanerId })
      .select('_id status day hour span date cleanerId clientId')
      .sort({ date: 1 })
      .lean();

    // Normalize booking fields
    const normBookings = (bookings || []).map(b => ({
      _id: String(b._id),
      source: 'booking',
      status: b.status || 'accepted',
      day: b.day,
      hour: Number(b.hour),
      span: Number(b.span || 1),
      endHour: Number(b.hour) + Number(b.span || 1),
      cleanerId: String(b.cleanerId),
      clientId: b.clientId ? String(b.clientId) : undefined,
      date: b.date || null,
    }));

    // 2) Purchases we also want to show on the grid
    //    Include pending + accepted so dashboard can see both.
    const purchases = await Purchase.find({
      cleanerId,
      status: { $in: ['pending', 'pending_approval', 'accepted'] },
    })
      .select('_id status day hour span cleanerId clientId createdAt serviceKey serviceName durationMins bufferBeforeMins bufferAfterMins')
      .lean();

    const normPurchases = (purchases || []).map(p => ({
      _id: String(p._id),
      source: 'purchase',
      status: p.status === 'accepted' ? 'accepted' : 'pending',
      day: p.day,
      hour: Number(p.hour),
      span: Number(p.span || 1),
      endHour: Number(p.hour) + Number(p.span || 1),
      cleanerId: String(p.cleanerId),
      clientId: p.clientId ? String(p.clientId) : undefined,
      date: p.createdAt || null,
      serviceKey: p.serviceKey || '',
      serviceName: p.serviceName || '',
      durationMins: typeof p.durationMins === 'number' ? p.durationMins : null,
      bufferBeforeMins: p.bufferBeforeMins || 0,
      bufferAfterMins: p.bufferAfterMins || 0,
    }));

    // 3) Avoid duplicates/overlaps: if a purchase overlaps an existing booking slot, skip it
    const overlaps = (a, b) => a.day === b.day && !(a.endHour <= b.hour || b.endHour <= a.hour);

    const filteredPurchases = normPurchases.filter(p => {
      return !normBookings.some(b => overlaps(p, b));
    });

    // 4) Merge and sort (by date if present, else by weekday index then start hour)
    const weekdayIndex = d => DAYS.indexOf(d);
    const combined = [...normBookings, ...filteredPurchases].sort((a, b) => {
      if (a.date && b.date) return new Date(a.date) - new Date(b.date);
      if (a.day !== b.day) return weekdayIndex(a.day) - weekdayIndex(b.day);
      return a.hour - b.hour;
    });

    // DEBUG (optional)
    // console.log('GET /api/bookings/cleaner/:id', {
    //   cleanerId,
    //   bookings: normBookings.length,
    //   purchases: normPurchases.length,
    //   combined: combined.length,
    //   sample: combined.slice(0, 3),
    // });

    return json({ success: true, bookings: combined });
  } catch (err) {
    console.error('❌ Fetch Cleaner Bookings Error:', err);
    return json({ success: false, message: 'Error fetching bookings' }, 500);
  }
}

/* ------------------------------- PUT (save) ------------------------------- */
/**
 * Updates the cleaner’s base availability grid.
 * NOTE: We only persist true/false/'unavailable' here.
 * Pending/accepted states are injected from purchases at read time.
 */
export async function PUT(req, { params }) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  const cleanerId = params?.id;
  const isSelf = user.type === 'cleaner' && String(user._id) === String(cleanerId);
  const isAdmin = user.type === 'admin';
  if (!isSelf && !isAdmin) return json({ success: false, message: 'Access denied.' }, 403);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, message: 'Invalid JSON body.' }, 400);
  }

  try {
    const availability = sanitizeAvailability(body?.availability || {});
    const updated = await Cleaner.findByIdAndUpdate(
      cleanerId,
      { $set: { availability } },
      { new: true }
    ).lean();

    if (!updated) return json({ success: false, message: 'Cleaner not found' }, 404);

    return json({ success: true, cleaner: { _id: String(updated._id), availability: updated.availability } });
  } catch (err) {
    console.error('❌ Availability Update Error:', err);
    return json({ success: false, message: 'Update failed' }, 500);
  }
}

/* -------------------------------- helpers -------------------------------- */

function sanitizeAvailability(av = {}) {
  const next = {};
  for (const d of DAYS) {
    const srcRow = av?.[d] || {};
    const row = {};
    for (const h of HOURS) {
      const v = srcRow?.[h];
      if (v === true || v === false || v === 'unavailable') {
        row[h] = v;
      }
      // ignore 'pending'/'booked' and anything else; those are transient
    }
    if (Object.keys(row).length) next[d] = row;
  }
  return next;
}
