import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import Cleaner from '@/models/Cleaner';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { NextResponse } from 'next/server';

const stripe = new Stripe('sk_test_51RdqMWQg7zJvOx8UPioT8e6Zw7OYGQlNwR4O6eowufu9HNFP1NrZUieHFLCJxvp0qFTdOahlvr61Ag8KJWADJbEs00yAfdGSDw');

// ✅ Disable Next.js's default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  await connectToDatabase();

  const buf = await req.arrayBuffer();
  const rawBody = Buffer.from(buf).toString();

  const sig = req.headers.get('stripe-signature');
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Stripe Webhook Error:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.metadata.bookingId;

    try {
      // ✅ Confirm the booking
      const booking = await Booking.findByIdAndUpdate(bookingId, { status: 'confirmed' }, { new: true });

      if (!booking) throw new Error('Booking not found');

      // ✅ Lock the booked slot in the cleaner's availability
      const cleaner = await Cleaner.findById(booking.cleanerId);

      if (!cleaner) throw new Error('Cleaner not found');

      // Set the booked slot to unavailable
      if (!cleaner.availability[booking.day]) {
        cleaner.availability[booking.day] = {};
      }
      cleaner.availability[booking.day][booking.time] = false; // Mark as unavailable

      await cleaner.save();

      console.log(`✅ Booking ${bookingId} confirmed and slot locked successfully.`);
    } catch (err) {
      console.error('❌ Booking processing error:', err.message);
      return new Response('Error processing booking', { status: 500 });
    }
  }

  return new Response('Webhook received successfully.', { status: 200 });
}
