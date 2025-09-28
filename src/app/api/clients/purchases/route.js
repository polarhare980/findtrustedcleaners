// src/app/api/clients/purchases/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';
import Booking from '@/models/booking';
import { requiredHourSpan, hasContiguousAvailability } from '@/lib/availability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const BOOKED_STATUSES = new Set(['accepted','confirmed','booked']);
const PENDING_PURCHASE_STATUSES = new Set(['pending','approved']); // approved holds the slot like booked

function json(data, status = 200, extraHeaders = {}) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function toHourString(h) {
  const n = Number(h);
  return Number.isFinite(n) ? String(parseInt(n, 10)) : '';
}

/* -------------------------- OPTIONS (preflight) --------------------------- */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

/* ------------------------------ GET (history) ------------------------------ */
export async function GET(req) {
  await connectToDatabase();

  const { valid, user } = await protectApiRoute(req);
  if (!valid) return json({ success: false, message: 'Unauthenticated' }, 401);
  if (user.type !== 'client') return json({ success: false, message: 'Access denied.' }, 403);

  try {
    const purchases = await Purchase.find({ clientId: user._id })
      .sort({ createdAt: -1 })
      .populate('cleanerId', 'realName companyName')
      .lean();

    return json({ success: true, purchases });
  } catch (err) {
    console.error('❌ Failed to fetch purchases:', err);
    return json({ success: false, message: 'Server error.' }, 500);
  }
}

/* ------------------------------ POST (create) ------------------------------ */
/**
 * Body:
 * {
 *   cleanerId: string,
 *   day: 'Monday'..'Sunday',
 *   hour: number (0..23) | string ('0'..'23'),
 *   serviceKey?: string,
 *   durationMins?: number,
 *   bufferBeforeMins?: number,
 *   bufferAfterMins?: number,
 *   currency?: string,   // default 'GBP'
 *   amount?: number,
 *   notes?: string,
 *   // isoDate?: 'YYYY-MM-DD'   // currently ignored server-side
 * }
 */
export async function POST(req) {
  await connectToDatabase();

  const { valid, user } = await protectApiRoute(req);
  if (!valid) return json({ success: false, message: 'Unauthenticated' }, 401);
  if (user.type !== 'client') return json({ success: false, message: 'Access denied.' }, 403);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, message: 'Invalid JSON body.' }, 400);
  }

  const {
    cleanerId,
    day,
    hour,
    serviceKey,
    durationMins,
    bufferBeforeMins,
    bufferAfterMins,
    currency = 'GBP',
    amount,
    notes,
  } = body || {};

  // Basic validation
  if (!mongoose.Types.ObjectId.isValid(String(cleanerId))) {
    return json({ success: false, message: 'Invalid cleanerId.' }, 400);
  }
  if (!DAYS.includes(day)) {
    return json({ success: false, message: 'Invalid day.' }, 400);
  }
  const startHourNum = Number(hour);
  if (!Number.isInteger(startHourNum) || startHourNum < 0 || startHourNum > 23) {
    return json({ success: false, message: 'Invalid start hour.' }, 400);
  }
  const startHourStr = toHourString(startHourNum);

  // Load cleaner & (optional) service
  const cleaner = await Cleaner.findById(cleanerId).lean();
  if (!cleaner) return json({ success: false, message: 'Cleaner not found.' }, 404);

  const svc =
    (cleaner.servicesDetailed || []).find(
      s => s && (s.key === serviceKey) && s.active !== false
    ) || null;

  const effDuration =
    typeof durationMins === 'number' && durationMins > 0
      ? durationMins
      : (svc?.defaultDurationMins ?? 60);

  const effBufBefore =
    typeof bufferBeforeMins === 'number' ? Math.max(0, bufferBeforeMins) : (svc?.bufferBeforeMins ?? 0);

  const effBufAfter =
    typeof bufferAfterMins === 'number' ? Math.max(0, bufferAfterMins) : (svc?.bufferAfterMins ?? 0);

  // Optional clamp to svc min/max if present
  if (svc) {
    const minD = svc.minDurationMins ?? 60;
    const maxD = svc.maxDurationMins ?? 240;
    if (effDuration < minD) return json({ success: false, message: `Duration below minimum (${minD} mins).` }, 400);
    if (effDuration > maxD) return json({ success: false, message: `Duration above maximum (${maxD} mins).` }, 400);
  }

  const span = requiredHourSpan({
    durationMins: effDuration,
    bufferBeforeMins: effBufBefore,
    bufferAfterMins: effBufAfter,
  });

  if (startHourNum + span > 24) {
    return json({ success: false, message: 'Requested span exceeds end of day.' }, 400);
  }

  // Build merged view = base availability + pending/approved purchases + accepted/confirmed/booked bookings
  try {
    const base = cleaner.availability || {};
    const merged = JSON.parse(JSON.stringify(base));
    if (!merged[day]) merged[day] = {};

    // 1) Pending & approved purchases (hold slots)
    const purchases = await Purchase.find({
      cleanerId,
      day,
      status: { $in: Array.from(PENDING_PURCHASE_STATUSES) },
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

    // 2) Existing bookings (block slots)
    const bookings = await Booking.find({
      cleanerId,
      day,
      status: { $in: Array.from(BOOKED_STATUSES) },
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

    // Validate contiguous availability for requested span
    if (!hasContiguousAvailability(merged, day, startHourNum, span)) {
      return json({ success: false, message: 'Start time no longer available for required duration.' }, 409);
    }
  } catch (e) {
    console.error('❌ Availability merge/check failed:', e);
    return json({ success: false, message: 'Could not validate availability.' }, 500);
  }

  // Prepare document (be resilient to strict schemas)
  const extendedDoc = {
    cleanerId,
    clientId: user._id,
    day,
    hour: startHourStr,          // store as simple integer string
    span,                        // used by overlays
    serviceKey,
    durationMins: effDuration,
    bufferBeforeMins: effBufBefore,
    bufferAfterMins: effBufAfter,
    currency,
    amount: typeof amount === 'number' ? amount : undefined,
    status: 'pending',
    notes: typeof notes === 'string' ? notes : undefined,
  };

  try {
    const doc = await Purchase.create(extendedDoc);
    return json({
      success: true,
      purchaseId: String(doc._id),
      span,
      status: doc.status,
      hour: startHourStr,
      day,
    }, 201);
  } catch (err) {
    console.warn('⚠️ Purchase.create failed with extended fields, retrying minimal. Error:', err?.message);

    try {
      const minimalDoc = {
        cleanerId,
        clientId: user._id,
        day,
        hour: startHourStr,
        status: 'pending',
        span, // keep if schema allows; comment out if not in schema
      };
      const doc = await Purchase.create(minimalDoc);
      return json({
        success: true,
        purchaseId: String(doc._id),
        span,
        status: doc.status,
        hour: startHourStr,
        day,
      }, 201);
    } catch (err2) {
      console.error('❌ Purchase.create failed (minimal):', err2);
      const message =
        err2?.errors
          ? Object.values(err2.errors).map(e => e.message).join('; ')
          : (err2?.message || 'Failed to create purchase.');
      const isValidation =
        /validation/i.test(message) ||
        /cast/i.test(message) ||
        err2?.name === 'ValidationError' ||
        err2?.name === 'CastError';
      return json({ success: false, message }, isValidation ? 400 : 500);
    }
  }
}
