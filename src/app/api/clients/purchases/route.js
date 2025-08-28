// src/app/api/clients/purchases/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';
import { requiredHourSpan, hasContiguousAvailability } from '@/lib/availability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function json(data, status = 200, extraHeaders = {}) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
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
 *   hour: number (0..23),
 *   serviceKey: string,                // optional but recommended
 *   durationMins?: number,
 *   bufferBeforeMins?: number,
 *   bufferAfterMins?: number,
 *   currency?: 'GBP' | string,
 *   amount?: number,
 *   notes?: string,
 *   isoDate?: 'YYYY-MM-DD'             // optional; ignored by server for now
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
    serviceKey,         // may be absent if cleaner has simple services
    durationMins,
    bufferBeforeMins,
    bufferAfterMins,
    currency = 'GBP',
    amount,
    notes,
    // isoDate (optional, ignored)
  } = body || {};

  // Basic validation
  if (!mongoose.Types.ObjectId.isValid(String(cleanerId))) {
    return json({ success: false, message: 'Invalid cleanerId.' }, 400);
  }
  if (!DAYS.includes(day)) {
    return json({ success: false, message: 'Invalid day.' }, 400);
  }
  const startHour = Number(hour);
  if (!Number.isInteger(startHour) || startHour < 0 || startHour > 23) {
    return json({ success: false, message: 'Invalid start hour.' }, 400);
  }

  // Load cleaner + service config (if detailed services exist)
  const cleaner = await Cleaner.findById(cleanerId).lean();
  if (!cleaner) return json({ success: false, message: 'Cleaner not found.' }, 404);

  const svc = (cleaner.servicesDetailed || []).find(
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

  // Bound check
  if (startHour + span > 24) {
    return json({ success: false, message: 'Requested span exceeds end of day.' }, 400);
  }

  // Build merged view of availability for conflicts (pending holds + approved as booked)
  try {
    const base = cleaner.availability || {};
    const existing = await Purchase.find({
      cleanerId,
      day,
      status: { $in: ['pending', 'approved'] },
    }).lean();

    const merged = JSON.parse(JSON.stringify(base));
    if (!merged[day]) merged[day] = {};

    for (const p of existing || []) {
      const s = Number(p.span || 1);
      for (let i = 0; i < s; i++) {
        const hk = String(Number(p.hour) + i);
        if (merged[day][hk] === false || merged[day][hk] === 'unavailable') continue;
        merged[day][hk] = p.status === 'approved' ? 'booked' : 'pending';
      }
    }

    // Validate contiguous availability
    if (!hasContiguousAvailability(merged, day, startHour, span)) {
      return json({ success: false, message: 'Start time no longer available for required duration.' }, 409);
    }
  } catch (e) {
    console.error('❌ Availability merge/check failed:', e);
    // We still fail gracefully here to avoid double-booking.
    return json({ success: false, message: 'Could not validate availability.' }, 500);
  }

  // Attempt to create with extended fields; if schema is strict and rejects,
  // fall back to a minimal document that only uses known-safe fields.
  const extendedDoc = {
    cleanerId,
    clientId: user._id,
    day,
    hour: String(startHour),     // schema uses String
    span,                        // optional in schema; overlay uses default 1 if absent
    serviceKey,                  // might not exist in schema (strict mode may throw)
    durationMins: effDuration,   // might not exist in schema
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
    }, 201);
  } catch (err) {
    // If schema is strict and throws on unknown fields, retry with a minimal shape.
    console.warn('⚠️ Purchase.create failed with extended fields, retrying minimal. Error:', err?.message);

    try {
      const minimalDoc = {
        cleanerId,
        clientId: user._id,
        day,
        hour: String(startHour),
        status: 'pending',
        // keep span if your schema has it; otherwise comment the next line:
        span,
      };
      const doc = await Purchase.create(minimalDoc);
      return json({
        success: true,
        purchaseId: String(doc._id),
        span,
        status: doc.status,
      }, 201);
    } catch (err2) {
      console.error('❌ Purchase.create failed (minimal):', err2);
      // Surface a readable message to the client
      const message =
        err2?.errors
          ? Object.values(err2.errors).map(e => e.message).join('; ')
          : (err2?.message || 'Failed to create purchase.');
      // 400 for validation/cast issues; 500 otherwise
      const isValidation =
        /validation/i.test(message) ||
        /cast/i.test(message) ||
        err2?.name === 'ValidationError' ||
        err2?.name === 'CastError';
      return json({ success: false, message }, isValidation ? 400 : 500);
    }
  }
}
