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
    // 1. Cancel the payment intent
    await stripe.paymentIntents.cancel(purchase.paymentIntentId);

    // 2. Mark slot as available again
    const update = {};
    update[`availability.${purchase.day}.${purchase.hour}`] = true;
    await Cleaner.findByIdAndUpdate(purchase.cleanerId, { $set: update });

    // 3. Update purchase status
    purchase.status = 'declined';
    await purchase.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Decline error:', err);
    return NextResponse.json({ error: 'Failed to decline booking' }, { status: 500 });
  }
}
