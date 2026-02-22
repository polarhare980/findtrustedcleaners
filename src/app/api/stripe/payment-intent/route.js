import { connectToDatabase } from '@/lib/db';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  await connectToDatabase();

  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
    }

    const user = await verifyToken(token);

    if (!user || user.type !== 'client') {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const { cleanerId, day, time, price } = await req.json();

    // NOTE: We do NOT create a Booking record here.
    // Creating DB records before payment confirmation caused orphaned rows
    // and model mismatches. The DB record is created AFTER payment confirms.

    const amountPence = Math.round(Number(price) * 100);
    if (
      !cleanerId ||
      !day ||
      (time === undefined || time === null) ||
      !Number.isFinite(amountPence) ||
      amountPence <= 0
    ) {
      return NextResponse.json(
        { success: false, message: 'Missing/invalid payment fields.' },
        { status: 400 }
      );
    }

    // ✅ Create Stripe PaymentIntent with delayed capture
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountPence,
      currency: 'gbp',
      capture_method: 'manual',
      metadata: {
        cleanerId: String(cleanerId),
        clientId: String(user.id),
        day: String(day),
        hour: String(time),
      },
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error('❌ Stripe Payment Intent Error:', err.message);
    return NextResponse.json(
      { success: false, message: 'Stripe Payment Intent error' },
      { status: 500 }
    );
  }
}