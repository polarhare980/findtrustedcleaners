import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * POST /api/clients/contact-unlock
 * Body: { cleanerId: string }
 *
 * Returns cleaner contact details if the logged-in client has an
 * ACCEPTED booking with that cleaner. If there is a PENDING booking,
 * returns a friendly status. Otherwise, asks the client to create a proper
 * booking via /api/purchases/create (service + day/hour).
 */
export async function POST(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;
  if (user.type !== 'client') {
    return json({ success: false, message: 'Access denied.' }, 403);
  }

  let body;
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

  // Find the most recent purchase between this client and cleaner
  const purchase = await Purchase.findOne({ clientId: user._id, cleanerId })
    .sort({ createdAt: -1 })
    .lean();

  if (!purchase) {
    // No purchase yet – client must create a proper booking (service + timeslot)
    return json({
      success: false,
      requiresBooking: true,
      message: 'No booking found. Create a booking with a service and start time to unlock contact details.',
    }, 404);
  }

  if (purchase.status === 'accepted') {
    // ✅ Contact unlock permitted
    return json({
      success: true,
      cleanerName: cleaner.companyName || cleaner.realName || '',
      phone: cleaner.phone || '',
      email: cleaner.email || '',
      purchaseId: String(purchase._id),
      status: 'accepted',
      message: 'Contact details unlocked.',
    });
  }

  if (purchase.status === 'pending' || purchase.status === 'pending_approval') {
    // ⏳ Waiting on cleaner approval
    return json({
      success: false,
      pending: true,
      purchaseId: String(purchase._id),
      status: purchase.status,
      message: 'Your booking request is pending approval. Contact details will unlock once accepted.',
    }, 202);
  }

  // For declined/cancelled/refunded, instruct to create a new booking
  return json({
    success: false,
    requiresBooking: true,
    purchaseId: String(purchase._id),
    status: purchase.status,
    message: 'No active booking. Please create a new booking to unlock contact details.',
  }, 409);
}
