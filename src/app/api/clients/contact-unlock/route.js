// File: src/app/api/clients/contact-unlock/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';

/**
 * POST /api/clients/contact-unlock
 * Body: { cleanerId: string }
 *
 * If the current logged-in client has an ACCEPTED purchase with the given cleaner,
 * return the cleaner's contact details. If the latest purchase is PENDING, tell the
 * client it's pending. Otherwise, require a new booking.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req, 'client');
  if (!valid) return response; // 401/403 handled inside

  let body = null;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, message: 'Invalid JSON body.' }, 400);
  }

  const cleanerId = body?.cleanerId;
  if (!cleanerId) return json({ success: false, message: 'cleanerId is required.' }, 400);

  // Ensure cleaner exists
  const cleaner = await Cleaner.findById(cleanerId).select('realName companyName email phone').lean();
  if (!cleaner) return json({ success: false, message: 'Cleaner not found.' }, 404);

  // Latest purchase between this client and cleaner
  const purchase = await Purchase.findOne({ clientId: user._id, cleanerId })
    .sort({ createdAt: -1 })
    .lean();

  if (!purchase) {
    return json({
      success: false,
      requiresBooking: true,
      message: 'No booking found. Create a booking with a service and start time to unlock contact details.',
    }, 404);
  }

  if (purchase.status === 'accepted') {
    return json({
      success: true,
      unlocked: true,
      cleanerName: cleaner.companyName || cleaner.realName || '',
      phone: cleaner.phone || '',
      email: cleaner.email || '',
      purchaseId: String(purchase._id),
      status: purchase.status,
      message: 'Contact details unlocked.',
    });
  }

  if (purchase.status === 'pending' || purchase.status === 'pending_approval') {
    return json({
      success: true,
      unlocked: false,
      purchaseId: String(purchase._id),
      status: purchase.status,
      message: 'Your booking request is pending approval. Contact details will unlock once accepted.',
    }, 202);
  }

  return json({
    success: false,
    requiresBooking: true,
    purchaseId: String(purchase._id),
    status: purchase.status,
    message: 'No active booking. Please create a new booking to unlock contact details.',
  }, 409);
}
