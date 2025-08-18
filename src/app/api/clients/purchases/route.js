// src/app/api/clients/purchases/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';
import { requiredHourSpan, hasContiguousAvailability } from '@/lib/availability';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

/* ------------------------------ GET (history) ------------------------------ */
export async function GET(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;
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
 * Create a span-aware pending purchase.
 * Body:
 * {
 *   cleanerId: string,
 *   day: 'Monday'...'Sunday',
 *   hour: number,                 // 24h integer start hour (e.g. 9)
 *   serviceKey: string,           // key from cleaner.servicesDetailed
 *   // optional overrides (backend falls back to service defaults):
 *   durationMins?: number,
 *   bufferBeforeMins?: number,
 *   bufferAfterMins?: number,
 *   // optional pricing
 *   currency?: 'GBP' | string,
 *   amount?: number               // pounds
 * }
 */
export async function POST(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;
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
    amount, // pounds (optional)
    notes,
  } = body || {};

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
  if (!serviceKey) {
    return json({ success: false, message: 'serviceKey is required.' }, 400);
  }

  // Load cleaner + service config
  const cleaner = await Cleaner.findById(cleanerId).lean();
  if (!cleaner) return json({ success: false, message: 'Cleaner not found.' }, 404);

  const svc = (cleaner.servicesDetailed || []).find(s => s.key === serviceKey && s.active !== false) || null;
  const effDuration =
    typeof durationMins === 'number' && durationMins > 0
      ? durationMins
      : (svc?.defaultDurationMins ?? 60);
  const effBufBefore =
    typeof bufferBeforeMins === 'number' ? Math.max(0, bufferBeforeMins) : (svc?.bufferBeforeMins ?? 0);
  const effBufAfter =
    typeof bufferAfterMins === 'number' ? Math.max(0, bufferAfterMins) : (svc?.bufferAfterMins ?? 0);

  // Clamp to service min/max if present
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

  // Bound check (don’t roll past midnight)
  if (startHour + span > 24) {
    return json({ success: false, message: 'Requested span exceeds end of day.' }, 400);
  }

  // Compose merged availability for the day with current pending/accepted
  const base = cleaner.availability || {};
  const blocking = await Purchase.find({
    cleanerId,
    day,
    status: { $in: ['pending', 'pending_approval', 'accepted'] },
  }).lean();

  const merged = JSON.parse(JSON.stringify(base));
  if (!merged[day]) merged[day] = {};
  for (const p of blocking || []) {
    const s = Number(p.span || 1);
    for (let i = 0; i < s; i++) {
      const hk = String(Number(p.hour) + i);
      if (merged[day][hk] === false || merged[day][hk] === 'unavailable') continue;
      merged[day][hk] = p.status === 'accepted' ? 'booked' : 'pending';
    }
  }

  // Validate contiguous availability
  if (!hasContiguousAvailability(merged, day, startHour, span)) {
    return json({ success: false, message: 'Start time no longer available for required duration.' }, 409);
  }

  // Create pending purchase (approval flow)
  const doc = await Purchase.create({
    cleanerId,
    clientId: user._id,
    day,
    hour: startHour,
    span,
    serviceKey,
    serviceName: svc?.name,
    durationMins: effDuration,
    bufferBeforeMins: effBufBefore,
    bufferAfterMins: effBufAfter,
    currency,
    amount: typeof amount === 'number' ? amount : undefined, // optional
    status: 'pending_approval',
    notes: typeof notes === 'string' ? notes : undefined,
  });

  return json({
    success: true,
    purchaseId: String(doc._id),
    span,
    status: doc.status,
  });
}
