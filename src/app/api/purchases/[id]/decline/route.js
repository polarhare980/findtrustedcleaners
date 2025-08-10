import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function PUT(req, { params }) {
  await connectToDatabase();
  const purchaseId = params.id;

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  if (user.type !== 'cleaner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!mongoose.Types.ObjectId.isValid(String(purchaseId))) {
    return NextResponse.json({ error: 'Invalid purchase id' }, { status: 400 });
  }

  try {
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    if (String(user._id) !== String(purchase.cleanerId)) {
      return NextResponse.json({ error: 'You can only decline your own bookings.' }, { status: 403 });
    }

    if (purchase.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending purchases can be declined' }, { status: 400 });
    }

    // 🛑 Cancel the payment intent
    if (purchase.paymentIntentId) {
      try {
        await stripe.paymentIntents.cancel(purchase.paymentIntentId);
      } catch (err) {
        console.error('❌ Stripe cancel error:', err);
        return NextResponse.json({ error: 'Payment cancel failed' }, { status: 402 });
      }
    }

    // ♻️ Mark slot as available again
    if (purchase.day && purchase.hour) {
      const key = `availability.${purchase.day}.${purchase.hour}`;
      await Cleaner.findByIdAndUpdate(purchase.cleanerId, { $set: { [key]: true } });
    }

    // 📌 Update purchase status
    purchase.status = 'declined';
    await purchase.save();

    return NextResponse.json({ success: true, purchase });
  } catch (err) {
    console.error('❌ Decline error:', err);
    return NextResponse.json({ error: 'Failed to decline booking' }, { status: 500 });
  }
}
