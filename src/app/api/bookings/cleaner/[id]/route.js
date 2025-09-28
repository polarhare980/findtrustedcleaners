// File: src/app/api/bookings/cleaner/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Booking from '@/models/booking'; // ⚠️ Ensure correct casing
import Purchase from '@/models/Purchase';
import { requiredHourSpan, hasContiguousAvailability } from '@/lib/availability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

const BOOKED_BOOKING_STATUSES = new Set(['accepted', 'confirmed', 'booked']);
const BOOKED_OR_HOLD_PURCHASE_STATUSES = new Set(['approved']); // approved == held/blocked
const PENDING_PURCHASE_STATUSES = new Set(['pending', 'pending_approval']);

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function toHourString(h) {
  const n = Number(h);
  return Number.isFinite(n) ? String(parseInt(n, 10)) : '';
}

/* --------------------------------------
   GET: return bookings + purchases combined
-------------------------------------- */
export async function GET(_req, { params }) {
  await connectToDatabase();
  const cleanerId = params?.id;
  if (!cleanerId) return json({ success: false, message: 'Cleaner id required.' }, 400);

  try {
    // Only pull statuses the UI actually uses for overlays
    const bookings = await Booking.find({
      cleanerId,
      status: { $in: Array.from(BOOKED_BOOKING_STATUSES) },
    }).lean();

    const purchases = await Purchase.find({
      cleanerId,
      status: { $in: Array.from(new Set([
        ...PENDING_PURCHASE_STATUSES,
        ...BOOKED_OR_HOLD_PURCHASE_STATUSES,
      ])) },
    }).lean();

    const combined = [];

    for (const b of bookings || []) {
      combined.push({
        _id: String(b._id),
        type: 'booking',
        day: b?.day || '',
        hour: toHourString(b?.hour),
        span: Number(b?.span || 1), // ✅ include span
        status: String(b?.status || 'booked').toLowerCase(),
      });
    }

    for (const p of purchases || []) {
      const status = String(p?.status || 'pending').toLowerCase();
      // Sanity gate (defensive)
      if (
        !PENDING_PURCHASE_STATUSES.has(status) &&
        !BOOKED_OR_HOLD_PURCHASE_STATUSES.has(status)
      ) continue;

      combined.push({
        _id: String(p._id),
        type: 'purchase',
        day: p?.day || '',
        hour: toHourString(p?.hour),
        span: Number(p?.span || 1), // ✅ include span
        status,
      });
    }

    return json({ success: true, combined });
  } catch (err) {
    console.error('❌ GET /api/bookings/cleaner/:id failed:', err);
    return json({ success: false, message: 'Server error' }, 500);
  }
}

/* --------------------------------------
   PUT: update base availability only
-------------------------------------- */
export async function PUT(req, { params }) {
  await connectToDatabase();
  const cleanerId = params?.id;
  if (!cleanerId) return json({ success: false, message: 'Cleaner id required.' }, 400);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, message: 'Invalid JSON body.' }, 400);
  }

  const availability =
    body?.availability && typeof body.availability === 'object'
      ? body.availability
      : typeof body === 'object'
      ? body
      : null;

  if (!availability) return json({ success: false, message: 'availability object required.' }, 400);

  const HOURS = Array.from({ length: 13 }, (_, i) => String(7 + i));

  const cleaned = {};
  for (const day of DAYS) {
    if (!availability[day]) continue;
    cleaned[day] = {};
    for (const h of HOURS) {
      const v = availability[day][h];
      if (v === true || v === false || v === 'unavailable') {
        cleaned[day][h] = v;
      }
    }
  }

  try {
    const updated = await Cleaner.findByIdAndUpdate(
      cleanerId,
      { $set: { availability: cleaned } },
      { new: true, select: { _id: 1 } }
    );
    if (!updated) return json({ success: false, message: 'Cleaner not found.' }, 404);

    return json({ success: true });
  } catch (err) {
    console.error('❌ PUT /api/bookings/cleaner/:id failed:', err);
    return json({ success: false, message: 'Server error' }, 500);
  }
}

/* --------------------------------------
   POST: create a PENDING purchase (service + duration)
   (kept here for backwards compatibility; prefers the dedicated purchases route)
-------------------------------------- */
export async function POST(req, { params }) {
  await connectToDatabase();
  const cleanerId = params?.id;
  if (!cleanerId) return json({ success: false, message: 'Cleaner id required.' }, 400);

  try {
    const body = await req.json();
    const { day, hour, serviceKey, clientId } = body || {};

    if (!DAYS.includes(day || '')) {
      return json({ success: false, message: 'Valid day required.' }, 400);
    }
    const startNum = Number(hour);
    if (!Number.isInteger(startNum) || startNum < 0 || startNum > 23) {
      return json({ success: false, message: 'Valid hour (0..23) required.' }, 400);
    }
    if (!serviceKey || !clientId) {
      return json({ success: false, message: 'serviceKey and clientId required.' }, 400);
    }

    const cleaner = await Cleaner.findById(cleanerId).lean();
    if (!cleaner) return json({ success: false, message: 'Cleaner not found' }, 404);

    // 1) Find service
    const service = (cleaner.servicesDetailed || []).find(
      (s) => s && s.key === serviceKey && s.active !== false
    );
    if (!service) return json({ success: false, message: 'Service not available' }, 400);

    // 2) Compute span using your shared helper
    const span = requiredHourSpan({
      durationMins: service?.defaultDurationMins ?? 60,
      bufferBeforeMins: service?.bufferBeforeMins ?? 0,
      bufferAfterMins: service?.bufferAfterMins ?? 0,
    });
    if (startNum + span > 24) {
      return json({ success: false, message: 'Requested span exceeds end of day.' }, 400);
    }

    // 3) Build a merged availability view: base + pending/approved purchases + existing booked bookings
    const base = cleaner.availability || {};
    const merged = JSON.parse(JSON.stringify(base));
    if (!merged[day]) merged[day] = {};

    // Existing purchases that hold/occupy slots
    const purchases = await Purchase.find({
      cleanerId,
      day,
      status: { $in: ['pending', 'pending_approval', 'approved'] },
    }).lean();

    for (const p of purchases || []) {
      const s = Number(p?.span || 1);
      const start = Number(p?.hour);
      if (!Number.isInteger(start)) continue;
      for (let i = 0; i < Math.max(1, s); i++) {
        const hk = String(start + i);
        if (merged[day][hk] === false || merged[day][hk] === 'unavailable') continue;
        merged[day][hk] = (String(p.status).toLowerCase() === 'approved') ? 'booked' : 'pending';
      }
    }

    // Existing bookings that are booked
    const bookings = await Booking.find({
      cleanerId,
      day,
      status: { $in: Array.from(BOOKED_BOOKING_STATUSES) },
    }).lean();

    for (const b of bookings || []) {
      const s = Number(b?.span || 1);
      const start = Number(b?.hour);
      if (!Number.isInteger(start)) continue;
      for (let i = 0; i < Math.max(1, s); i++) {
        const hk = String(start + i);
        merged[day][hk] = 'booked';
      }
    }

    // 4) Validate contiguity for the requested span
    if (!hasContiguousAvailability(merged, day, startNum, span)) {
      return json({ success: false, message: 'Not enough time available' }, 409);
    }

    // 5) Create pending purchase (normalised fields)
    const purchase = await Purchase.create({
      clientId,
      cleanerId,
      day,
      hour: toHourString(startNum),
      span,
      status: 'pending',
      serviceKey,
    });

    // 6) Respond
    const blockedSlots = Array.from({ length: span }, (_, i) => toHourString(startNum + i));
    return json({ success: true, purchase, blockedSlots });
  } catch (err) {
    console.error('❌ POST /api/bookings/cleaner/:id failed:', err);
    return json({ success: false, message: 'Server error' }, 500);
  }
}
