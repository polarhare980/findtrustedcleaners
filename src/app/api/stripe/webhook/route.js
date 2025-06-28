import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import Cleaner from '@/models/Cleaner';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  await connectToDatabase();

  const rawBody = await request.text(); // ✅ Correct way to get raw body
  const signature = request.headers.get('stripe-signature');
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
  } catch (err) {
    console.error('❌ Stripe Webhook Error:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.metadata.bookingId;

    try {
      const booking = await Booking.findByIdAndUpdate(
        bookingId,
        { status: 'confirmed' },
        { new: true }
      );

      if (!booking) throw new Error('Booking not found');

      const cleaner = await Cleaner.findById(booking.cleanerId);
      if (!cleaner) throw new Error('Cleaner not found');

      if (!cleaner.availability[booking.day]) {
        cleaner.availability[booking.day] = {};
      }

      cleaner.availability[booking.day][booking.time] = false; // Lock the slot

      await cleaner.save();

      console.log(`✅ Booking ${bookingId} confirmed and slot locked successfully.`);
    } catch (err) {
      console.error('❌ Booking processing error:', err.message);
      return new Response('Error processing booking', { status: 500 });
    }
  }

  return new Response('Webhook received successfully.', { status: 200 });
}
