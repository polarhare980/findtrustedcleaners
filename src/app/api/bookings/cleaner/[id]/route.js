// File: src/app/api/bookings/cleaner/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Booking from '@/models/booking';
import Purchase from '@/models/Purchase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

const BOOKED_STATUSES = new Set(['approved', 'accepted', 'confirmed', 'booked']);
const PENDING_STATUSES = new Set(['pending', 'pending_approval']);

/* --------------------------------------
   GET: return bookings + purchases combined
-------------------------------------- */
export async function GET(_req, { params }) {
  await connectToDatabase();
  const cleanerId = params?.id;
  if (!cleanerId) return json({ success: false, message: 'Cleaner id required.' }, 400);

  try {
    const bookings = await Booking.find({ cleanerId }).lean();
    const purchases = await Purchase.find({ cleanerId }).lean();

    const combined = [];

    for (const b of bookings || []) {
      combined.push({
        _id: String(b._id),
        type: 'booking',
        day: b?.day || '',
        hour: String(b?.hour ?? ''),
        status: String(b?.status || 'pending').toLowerCase(),
      });
    }

    for (const p of purchases || []) {
      const status = String(p?.status || 'pending').toLowerCase();
      if (!(PENDING_STATUSES.has(status) || BOOKED_STATUSES.has(status))) continue;

      combined.push({
        _id: String(p._id),
        type: 'purchase',
        day: p?.day || '',
        hour: String(p?.hour ?? ''),
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

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
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
   POST: create a booking (service + duration)
-------------------------------------- */
export async function POST(req, { params }) {
  await connectToDatabase();
  const cleanerId = params?.id;
  if (!cleanerId) return json({ success: false, message: 'Cleaner id required.' }, 400);

  try {
    const body = await req.json();
    const { day, hour, serviceKey, clientId } = body;

    if (!day || !hour || !serviceKey || !clientId) {
      return json({ success: false, message: 'day, hour, serviceKey, clientId required' }, 400);
    }

    const cleaner = await Cleaner.findById(cleanerId).lean();
    if (!cleaner) return json({ success: false, message: 'Cleaner not found' }, 404);

    // 1. Find service
    const service = (cleaner.servicesDetailed || []).find(
      (s) => s.key === serviceKey && s.active
    );
    if (!service) return json({ success: false, message: 'Service not available' }, 400);

    // 2. Expand duration + buffers
    const totalMins =
      (service.bufferBeforeMins || 0) +
      (service.defaultDurationMins || 60) +
      (service.bufferAfterMins || 0);

    const increment = service.incrementMins || 60;
    const slotsNeeded = Math.ceil(totalMins / increment);

    const start = parseInt(hour, 10);
    const requiredSlots = [];
    for (let i = 0; i < slotsNeeded; i++) {
      requiredSlots.push(String(start + i));
    }

    // 3. Check availability
    const grid = cleaner.availability?.[day] || {};
    for (const h of requiredSlots) {
      if (grid[h] !== true) {
        return json({ success: false, message: 'Not enough time available' }, 400);
      }
    }

    // 4. Create pending purchase
    const purchase = await Purchase.create({
      clientId,
      cleanerId,
      day,
      hour, // store the chosen start hour
      status: 'pending',
    });

    return json({ success: true, purchase, blockedSlots: requiredSlots });
  } catch (err) {
    console.error('❌ POST /api/bookings/cleaner/:id failed:', err);
    return json({ success: false, message: 'Server error' }, 500);
  }
}
