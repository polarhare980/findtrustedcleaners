// src/app/api/clients/purchases/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner'; // (needed for sanity checks if you want)
import { setPendingSlot } from '@/lib/bookingAvailability';

// OPTIONAL: If you create PaymentIntents here, uncomment these 2 lines
// import Stripe from 'stripe';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// GET: list purchases for the logged-in client
export async function GET(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  if (user.type !== 'client') {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const purchases = await Purchase.find({ clientId: user._id })
      .sort({ createdAt: -1 })
      .populate('cleanerId', 'realName companyName')
      .lean();

    return NextResponse.json({ success: true, purchases });
  } catch (err) {
    console.error('❌ Failed to fetch purchases:', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// POST: create a pending purchase and mark the cleaner slot as "pending"
export async function POST(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  if (user.type !== 'client') {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { cleanerId, day, hour, amount } = body || {};

    // Basic validation
    if (!mongoose.Types.ObjectId.isValid(String(cleanerId))) {
      return NextResponse.json({ success: false, message: 'Invalid cleanerId' }, { status: 400 });
    }
    if (!day || !hour) {
      return NextResponse.json({ success: false, message: 'Missing day or hour' }, { status: 400 });
    }

    // OPTIONAL: sanity check cleaner exists
    const cleaner = await Cleaner.findById(cleanerId).select('_id availability').lean();
    if (!cleaner) {
      return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
    }

    // OPTIONAL: If you want to create a PaymentIntent here, uncomment
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(Number(amount || 299) * 100), // default £2.99 if not provided
    //   currency: 'gbp',
    //   capture_method: 'manual', // important for approve-later flow
    //   description: 'Cleaner contact unlock',
    //   metadata: {
    //     cleanerId: String(cleanerId),
    //     clientId: String(user._id),
    //     day,
    //     hour,
    //   },
    // });

    // Create the Purchase (pending)
    const purchase = await Purchase.create({
      cleanerId,
      clientId: user._id,
      day,
      hour,
      amount: Number(amount || 2.99), // keep your real price here
      status: 'pending',
      // paymentIntentId: paymentIntent.id, // uncomment if using PI here
    });

    // 🔴 IMPORTANT: mark the slot as pending so the cleaner dashboard shows ⏳ and has bookingId
    await setPendingSlot({
      cleanerId,
      day,
      hour,
      purchaseId: purchase._id,
    });

    return NextResponse.json({ success: true, purchase });
  } catch (err) {
    console.error('❌ Purchase create error:', err);
    return NextResponse.json({ success: false, message: 'Failed to create purchase' }, { status: 500 });
  }
}
