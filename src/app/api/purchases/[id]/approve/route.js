import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { protectRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function PUT(req, { params }) {
  await connectToDatabase();
  const purchaseId = params.id;

  const { valid, user, response } = await protectRoute(req);
  if (!valid) return response;

  const purchase = await Purchase.findById(purchaseId);
  if (!purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });

  if (String(user._id) !== String(purchase.cleanerId) && user.type !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // 1. Capture the payment
    await stripe.paymentIntents.capture(purchase.paymentIntentId);

    // 2. Mark slot as booked
    const update = {};
    update[`availability.${purchase.day}.${purchase.hour}`] = false;
    await Cleaner.findByIdAndUpdate(purchase.cleanerId, { $set: update });

    // 3. Update purchase status
    purchase.status = 'approved';
    await purchase.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Approve error:', err);
    return NextResponse.json({ error: 'Failed to approve booking' }, { status: 500 });
  }
}
