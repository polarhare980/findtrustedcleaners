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
  if (user.type !== 'cleaner') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });

    if (String(user._id) !== String(purchase.cleanerId)) {
      return NextResponse.json({ error: 'You can only decline your own bookings.' }, { status: 403 });
    }

    // Cancel the payment intent
    await stripe.paymentIntents.cancel(purchase.paymentIntentId);

    // Mark slot as available again
    const update = {};
    update[`availability.${purchase.day}.${purchase.hour}`] = true;
    await Cleaner.findByIdAndUpdate(purchase.cleanerId, { $set: update });

    // Update purchase status
    purchase.status = 'declined';
    await purchase.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Decline error:', err);
    return NextResponse.json({ error: 'Failed to decline booking' }, { status: 500 });
  }
}
