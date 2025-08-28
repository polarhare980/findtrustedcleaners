import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import Cleaner from '@/models/Cleaner';
import { NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function PUT(req, { params }) {
  await connectToDatabase();
  const { id } = params;

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  if (user.type !== 'cleaner') {
    return NextResponse.json(
      { success: false, message: 'Access denied.' },
      { status: 403 }
    );
  }

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found.' },
        { status: 404 }
      );
    }

    if (String(booking.cleanerId) !== String(user._id)) {
      return NextResponse.json(
        { success: false, message: 'You can only accept your own bookings.' },
        { status: 403 }
      );
    }

    if (booking.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Booking is not pending.' },
        { status: 400 }
      );
    }

    // ✅ Capture the held payment (if present)
    // Our schema uses `paymentIntentId` (not stripePaymentIntentId)
    if (booking.paymentIntentId) {
      try {
        await stripe.paymentIntents.capture(booking.paymentIntentId);
      } catch (err) {
        // If the PI is already in a terminal state, allow proceeding.
        const code = err?.raw?.code || err?.code || '';
        if (code !== 'payment_intent_unexpected_state') {
          console.error('❌ Stripe capture error:', err);
          return NextResponse.json(
            { success: false, message: 'Payment capture failed.' },
            { status: 402 }
          );
        }
      }
    }

    // ✅ Mark booking accepted (overlay will render it as booked)
    booking.status = 'accepted';
    booking.acceptedBy = user._id; // harmless extra metadata if you use it
    await booking.save();

    // 🔄 Return the cleaner's current base availability (booleans / 'unavailable' only)
    //    We DO NOT mutate availability here; overlay will show booked/pending state.
    const cleaner = await Cleaner.findById(booking.cleanerId).lean();
    const updatedAvailability = cleaner?.availability || {};

    return NextResponse.json({
      success: true,
      message: 'Booking accepted and payment captured successfully.',
      booking,
      updatedAvailability,
    });
  } catch (err) {
    console.error('❌ Booking acceptance error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error.' },
      { status: 500 }
    );
  }
}
