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
      return NextResponse.json({ error: 'You can only approve your own bookings.' }, { status: 403 });
    }

    if (purchase.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending purchases can be approved' }, { status: 400 });
    }

    // 🔒 Capture the payment (manual capture flow)
    if (purchase.paymentIntentId) {
      try {
        await stripe.paymentIntents.capture(purchase.paymentIntentId);
      } catch (err) {
        // If already captured, proceed; otherwise bubble the error
        const msg = err?.raw?.code || err?.message || 'capture_failed';
        if (msg !== 'payment_intent_unexpected_state') {
          console.error('❌ Stripe capture error:', err);
          return NextResponse.json({ error: 'Payment capture failed' }, { status: 402 });
        }
      }
    }

    // 🗓️ Mark slot as booked on the cleaner
    if (purchase.day && purchase.hour) {
      const key = `availability.${purchase.day}.${purchase.hour}`;
      // Keep structure consistent with your grid (object w/ status + bookingId)
      await Cleaner.findByIdAndUpdate(purchase.cleanerId, {
        $set: { [key]: { status: 'booked', bookingId: purchase._id } },
      });
    }

    // ✅ Update purchase status
    purchase.status = 'approved';
    await purchase.save();

    return NextResponse.json({ success: true, purchase });
  } catch (err) {
    console.error('❌ Approve error:', err);
    return NextResponse.json({ error: 'Failed to approve booking' }, { status: 500 });
  }
}
