// /app/api/bookings/accept-order/[id]/route.js

import { connectToDatabase } from '@/lib/db';
import Booking from '@/models/booking'; // ✅ Model name should be capitalized
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth'; // ✅ Should match where you store verifyToken

export async function PUT(req, { params }) {
  await connectToDatabase();
  const { id } = params;
  const body = await req.json();

  try {
    // 🔐 Validate JWT token
    const user = await verifyToken(req);

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
    }

    // ✅ Ensure only cleaners can accept orders
    if (user.type !== 'cleaner') {
      return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
    }

    // 🎯 Booking update logic example
    await Booking.findByIdAndUpdate(id, {
      status: 'accepted',
      acceptedBy: user.id,
      ...body, // if you want to allow additional fields
    });

    return NextResponse.json({ success: true, message: 'Order accepted.' });
  } catch (err) {
    console.error('❌ Booking acceptance error:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
