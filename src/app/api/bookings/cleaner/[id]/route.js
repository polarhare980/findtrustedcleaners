import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Booking from '@/models/booking';
import Purchase from '@/models/Purchase';
import { requiredHourSpan, hasContiguousAvailability } from '@/lib/availability';
import { protectApiRoute } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

const BOOKED_BOOKING_STATUSES = new Set(['accepted', 'confirmed', 'booked']);
const BOOKED_OR_HOLD_PURCHASE_STATUSES = new Set(['approved', 'accepted', 'confirmed', 'booked']);
const PENDING_PURCHASE_STATUSES = new Set(['pending', 'pending_approval']);
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function toHourString(h) {
  const n = Number(h);
  return Number.isFinite(n) ? String(parseInt(n, 10)) : '';
}

function normalizeServiceKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function findActiveService(services = [], serviceKey = '') {
  const wanted = normalizeServiceKey(serviceKey);
  return (services || []).find((s) => s && s.active !== false && normalizeServiceKey(s.key || s.name) === wanted) || null;
}

function applyDaySpan(grid, day, start, span, value) {
  if (!grid[day]) grid[day] = {};
  for (let i = 0; i < Math.max(1, span); i++) grid[day][String(start + i)] = value;
}

function buildEffectiveDayGrid({ cleaner, day, isoDate }) {
  const baseDay = cleaner?.availability?.[day] || {};
  const overrideDay = isoDate ? cleaner?.availabilityOverrides?.[isoDate] || {} : {};
  const merged = {};
  for (let h = 7; h <= 19; h++) {
    const key = String(h);
    merged[key] = Object.prototype.hasOwnProperty.call(overrideDay, key) ? overrideDay[key] : baseDay[key];
  }
  return { [day]: merged };
}

export async function GET(_req, context) {
  await connectToDatabase();
  const params = await context?.params;
  const cleanerId = params?.id;
  if (!cleanerId) return json({ success: false, message: 'Cleaner id required.' }, 400);

  try {
    const bookings = await Booking.find({ cleanerId, status: { $in: Array.from(BOOKED_BOOKING_STATUSES) } }).lean();
    const purchases = await Purchase.find({
      cleanerId,
      status: { $in: Array.from(new Set([...PENDING_PURCHASE_STATUSES, ...BOOKED_OR_HOLD_PURCHASE_STATUSES])) },
    }).lean();

    const combined = [];
    for (const b of bookings || []) {
      combined.push({ _id: String(b._id), type: 'booking', day: b?.day || '', hour: toHourString(b?.hour), span: Number(b?.span || 1), status: String(b?.status || 'booked').toLowerCase(), isoDate: typeof b?.isoDate === 'string' ? b.isoDate : '' });
    }
    for (const p of purchases || []) {
      const status = String(p?.status || 'pending').toLowerCase();
      if (!PENDING_PURCHASE_STATUSES.has(status) && !BOOKED_OR_HOLD_PURCHASE_STATUSES.has(status)) continue;
      combined.push({ _id: String(p._id), type: 'purchase', day: p?.day || '', hour: toHourString(p?.hour), span: Number(p?.span || 1), status, isoDate: typeof p?.isoDate === 'string' ? p.isoDate : '' });
    }
    return json({ success: true, combined });
  } catch (err) {
    console.error('❌ GET /api/bookings/cleaner/:id failed:', err);
    return json({ success: false, message: 'Server error' }, 500);
  }
}

export async function PUT(req, context) {
  await connectToDatabase();
  const params = await context?.params;
  const cleanerId = params?.id;
  if (!cleanerId) return json({ success: false, message: 'Cleaner id required.' }, 400);

  let body;
  try { body = await req.json(); } catch { return json({ success: false, message: 'Invalid JSON body.' }, 400); }
  const availability = body?.availability && typeof body.availability === 'object' ? body.availability : typeof body === 'object' ? body : null;
  if (!availability) return json({ success: false, message: 'availability object required.' }, 400);

  const HOURS = Array.from({ length: 13 }, (_, i) => String(7 + i));
  const cleaned = {};
  for (const day of DAYS) {
    if (!availability[day]) continue;
    cleaned[day] = {};
    for (const h of HOURS) {
      const v = availability[day][h];
      if (v === true || v === false || v === 'unavailable') cleaned[day][h] = v;
    }
  }

  try {
    const updated = await Cleaner.findByIdAndUpdate(cleanerId, { $set: { availability: cleaned } }, { new: true, select: { _id: 1 } });
    if (!updated) return json({ success: false, message: 'Cleaner not found.' }, 404);
    return json({ success: true });
  } catch (err) {
    console.error('❌ PUT /api/bookings/cleaner/:id failed:', err);
    return json({ success: false, message: 'Server error' }, 500);
  }
}

export async function POST(req, context) {
  await connectToDatabase();
  const params = await context?.params;
  const cleanerId = params?.id;
  if (!cleanerId) return json({ success: false, message: 'Cleaner id required.' }, 400);

  try {
    const { valid, user, response } = await protectApiRoute(req);
    if (!valid) return response;
    if (user.type !== 'client') return json({ success: false, message: 'Access denied.' }, 403);

    const body = await req.json();
    const { day, hour, serviceKey, isoDate } = body || {};

    if (!DAYS.includes(day || '')) return json({ success: false, message: 'Valid day required.' }, 400);
    const startNum = Number(hour);
    if (!Number.isInteger(startNum) || startNum < 0 || startNum > 23) return json({ success: false, message: 'Valid hour (0..23) required.' }, 400);
    if (!serviceKey) return json({ success: false, message: 'serviceKey required.' }, 400);

    const cleaner = await Cleaner.findById(cleanerId).lean();
    if (!cleaner) return json({ success: false, message: 'Cleaner not found' }, 404);
    const service = findActiveService(cleaner.servicesDetailed || [], serviceKey);
    if (!service) return json({ success: false, message: 'Service not available' }, 400);

    const span = requiredHourSpan({ durationMins: service?.defaultDurationMins ?? 60, bufferBeforeMins: 0, bufferAfterMins: 0 });
    if (startNum + span > 24) return json({ success: false, message: 'Requested span exceeds end of day.' }, 400);

    const merged = buildEffectiveDayGrid({ cleaner, day, isoDate });

    const purchases = await Purchase.find({ cleanerId, day, ...(isoDate ? { isoDate } : {}), status: { $in: ['pending', 'pending_approval', 'approved', 'accepted', 'confirmed', 'booked'] } }).lean();
    for (const p of purchases || []) {
      applyDaySpan(merged, day, Number(p?.hour), Number(p?.span || 1), ['approved', 'accepted', 'confirmed', 'booked'].includes(String(p.status).toLowerCase()) ? 'booked' : 'pending');
    }

    const bookings = await Booking.find({ cleanerId, day, ...(isoDate ? { isoDate } : {}), status: { $in: Array.from(BOOKED_BOOKING_STATUSES) } }).lean();
    for (const b of bookings || []) applyDaySpan(merged, day, Number(b?.hour), Number(b?.span || 1), 'booked');

    if (!hasContiguousAvailability(merged, day, startNum, span)) return json({ success: false, message: 'Not enough time available' }, 409);

    const purchase = await Purchase.create({
      clientId: user._id || user.id,
      cleanerId,
      day,
      hour: toHourString(startNum),
      isoDate: typeof isoDate === 'string' ? isoDate : undefined,
      span,
      serviceKey,
      serviceName: service?.name || '',
      durationMins: service?.defaultDurationMins ?? 60,
      bufferBeforeMins: 0,
      bufferAfterMins: 0,
      status: 'pending',
    });

    const blockedSlots = Array.from({ length: span }, (_, i) => toHourString(startNum + i));
    return json({ success: true, purchase, blockedSlots });
  } catch (err) {
    console.error('❌ POST /api/bookings/cleaner/:id failed:', err);
    return json({ success: false, message: 'Server error' }, 500);
  }
}
