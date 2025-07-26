// /app/api/cleaners/bookings/route.js

import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking';
import { protectApiRoute } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid || user.type !== 'cleaner') return response;

  try {
    const bookings = await Booking.find({ cleanerId: user._id })
      .sort({ createdAt: -1 })
      .populate('clientId', 'fullName email phone')
      .lean();

    return NextResponse.json({ success: true, bookings });
  } catch (err) {
    console.error('❌ Error fetching bookings:', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

