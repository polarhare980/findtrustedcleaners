// File: src/app/api/bookings/cleaner/[id]/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Cleaner from '@/models/Cleaner';

// ⚠️ Ensure filename/case matches the actual file on disk
import Booking from '@/models/booking';
import Purchase from '@/models/Purchase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const HOURS = Array.from({ length: 13 }, (_, i) => String(7 + i)); // "7".."19"

// Treat these as *booked* when merging (real bookings)
const BOOKED_STATUSES = new Set(['approved', 'accepted', 'confirmed', 'booked']);

// Treat these as *pending* overlay rows (from purchases)
const PENDING_STATUSES = new Set(['pending', 'pending_approval']); // keep 'pending_approval' if still present

/* -------------------------------- utils ---------------------------------- */
function json(data, status = 200) {
  return NextResponse.json(data, { status });
}
function isObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id));
}
function weekdayIndex(d) {
  return DAYS.indexOf(d);
}
function toNumberHour(val) {
  if (val === 0 || val === '0') return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    // support "7", "07", "7:00", "07:30" → take the hour part
    const m = val.match(/^(\d{1,2})/);
    return m ? Number(m[1]) : NaN;
  }
  return NaN;
}

// Keep only true/false/'unavailable'
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
    }
    if (Object.keys(row).length) next[d] = row;
  }
  return next;
}

/* --------------------------------- GET ----------------------------------- */
/**
 * Returns a *combined* list:
 * - Real bookings where status ∈ BOOKED_STATUSES
 * - Pending purchases where status ∈ PENDING_STATUSES
 * - No duplicates for same day/hour (prefer bookings over purchases)
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
    // 1) Real bookings (booked/accepted/etc.)
    const bookingsRaw = await Booking.find({
      cleanerId,
      ...(Booking.schema?.paths?.status
        ? { status: { $in: Array.from(BOOKED_STATUSES) } }
        : {}) // if your schema doesn't have status, this no-ops
    })
      .select('_id status day hour time span date cleanerId clientId')
      .lean();

    const normBookings = (bookingsRaw || [])
      .map((b) => {
        const hourNum = !Number.isNaN(toNumberHour(b.hour))
          ? toNumberHour(b.hour)
          : toNumberHour(b.time); // fallback if legacy schema uses "time"
        const span = Number(b.span || 1);

        return {
          _id: String(b._id),
          source: 'booking',
          status: b.status && BOOKED_STATUSES.has(b.status) ? b.status : 'booked',
          day: b.day,
          hour: hourNum,
          span,
          endHour: hourNum + span,
          cleanerId: String(b.cleanerId),
          clientId: b.clientId ? String(b.clientId) : undefined,
          date: b.date || null,
        };
      })
      .filter((b) => DAYS.includes(b.day) && Number.isFinite(b.hour));

    // 2) Pending purchases (overlay)
    const purchasesRaw = await Purchase.find({
      cleanerId,
      status: { $in: Array.from(PENDING_STATUSES) },
    })
      .select('_id status day hour span cleanerId clientId createdAt serviceKey serviceName durationMins bufferBeforeMins bufferAfterMins')
      .lean();

    const normPurchases = (purchasesRaw || [])
      .map((p) => {
        const hourNum = toNumberHour(p.hour);
        const span = Number(p.span || 1);
        return {
          _id: String(p._id),
          source: 'purchase',
          status: 'pending', // normalize both 'pending' & 'pending_approval' to 'pending' for UI
          day: p.day,
          hour: hourNum,
          span,
          endHour: hourNum + span,
          cleanerId: String(p.cleanerId),
          clientId: p.clientId ? String(p.clientId) : undefined,
          date: p.createdAt || null,
          serviceKey: p.serviceKey || '',
          serviceName: p.serviceName || '',
          durationMins: typeof p.durationMins === 'number' ? p.durationMins : null,
          bufferBeforeMins: p.bufferBeforeMins || 0,
          bufferAfterMins: p.bufferAfterMins || 0,
        };
      })
      .filter((p) => DAYS.includes(p.day) && Number.isFinite(p.hour));

    // 3) Remove overlaps: if a purchase overlaps any booking span, drop the purchase
    const overlaps = (a, b) => a.day === b.day && !(a.endHour <= b.hour || b.endHour <= a.hour);

    const filteredPurchases = normPurchases.filter((p) => {
      return !normBookings.some((b) => overlaps(p, b));
    });

    // 4) Merge + sort (prefer chronological if date present; else weekday + hour)
    const combined = [...normBookings, ...filteredPurchases].sort((a, b) => {
      if (a.date && b.date) return new Date(a.date) - new Date(b.date);
      if (a.day !== b.day) return weekdayIndex(a.day) - weekdayIndex(b.day);
      return a.hour - b.hour;
    });

    return json({ success: true, bookings: combined });
  } catch (err) {
    console.error('❌ GET /api/bookings/cleaner/:id error:', err);
    return json({ success: false, message: 'Error fetching bookings' }, 500);
  }
}

/* --------------------------------- PUT ----------------------------------- */
/**
 * Updates the cleaner’s *base* availability only.
 * - Accepts booleans and 'unavailable' per cell
 * - MUST NOT persist 'pending' or 'booked' etc. (those are transient overlays)
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

    return json({
      success: true,
      cleaner: { _id: String(updated._id), availability: updated.availability },
    });
  } catch (err) {
    console.error('❌ PUT /api/bookings/cleaner/:id error:', err);
    return json({ success: false, message: 'Update failed' }, 500);
  }
}
