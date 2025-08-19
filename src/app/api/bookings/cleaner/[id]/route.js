// File: src/app/api/clients/purchases/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase';
import mongoose from 'mongoose';

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

// POST /api/clients/purchases
// Creates a pending Purchase (overlay). DOES NOT update Cleaner.availability.
export async function POST(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;
  if (user.type !== 'client') {
    return json({ success: false, message: 'Only clients can create purchases.' }, 403);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, message: 'Invalid JSON body.' }, 400);
  }

  const {
    cleanerId,
    day,
    hour,                // string "7".."19" (store as string)
    amount,              // optional
    serviceKey,          // optional
    serviceName,         // optional
    durationMins,        // optional number
    bufferBeforeMins,    // optional number
    bufferAfterMins,     // optional number
    span,                // optional number of hours (default 1)
    stripeSessionId,     // optional
    paymentIntentId,     // optional
  } = body || {};

  // Basic validation
  if (!isObjectId(cleanerId)) {
    return json({ success: false, message: 'Invalid cleanerId.' }, 400);
  }
  if (!DAYS.includes(day)) {
    return json({ success: false, message: 'Invalid day.' }, 400);
  }
  const hourStr = String(hour);
  if (!HOURS.includes(hourStr)) {
    return json({ success: false, message: 'Invalid hour.' }, 400);
  }

  try {
    const purchase = await Purchase.create({
      clientId: user._id,
      cleanerId,
      day,
      hour: hourStr,                 // ✅ store as string
      amount: typeof amount === 'number' ? amount : undefined,
      status: 'pending',             // ✅ overlay status
      serviceKey: serviceKey || undefined,
      serviceName: serviceName || undefined,
      durationMins: typeof durationMins === 'number' ? durationMins : undefined,
      bufferBeforeMins: typeof bufferBeforeMins === 'number' ? bufferBeforeMins : undefined,
      bufferAfterMins: typeof bufferAfterMins === 'number' ? bufferAfterMins : undefined,
      span: typeof span === 'number' && span > 0 ? span : 1,
      stripeSessionId: stripeSessionId || undefined,
      paymentIntentId: paymentIntentId || undefined,
    });

    // 🚫 NO availability writes. No setPendingSlot. Overlay only.

    return json({ success: true, purchase });
  } catch (err) {
    console.error('❌ POST /api/clients/purchases error:', err);
    return json({ success: false, message: 'Failed to create purchase.' }, 500);
  }
}
