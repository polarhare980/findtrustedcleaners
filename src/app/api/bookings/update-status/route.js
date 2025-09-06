// /app/api/bookings/update-status/route.js

import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid || user.type !== 'cleaner') return response;

  try {
    const { purchaseId, status } = await req.json();
    if (!['approved', 'declined'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase || purchase.cleanerId.toString() !== user._id.toString()) {
      return NextResponse.json({ success: false, message: 'Not authorised or not found' }, { status: 404 });
    }

    purchase.status = status;
    await purchase.save();

    if (purchase.paymentIntentId) {
  if (status === 'approved') {
    // ✅ Capture payment
    await stripe.paymentIntents.capture(purchase.paymentIntentId);
  } else if (status === 'declined') {
    // ❌ Cancel the payment (releases the hold)
    await stripe.paymentIntents.cancel(purchase.paymentIntentId);
  }
}


    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error('❌ Status update error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
