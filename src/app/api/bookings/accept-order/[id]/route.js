// /app/api/bookings/accept-order/[id]/route.js

import { connectToDatabase } from '@/lib/db';
import booking from '@/models/booking';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/middleware/verifyToken'; // 🔐 Import your JWT middleware

export async function PUT(req, { params }) {
  await connectToDatabase();
  const { id } = params;
  const body = await req.json();

  try {
    // 🔐 Validate JWT token
    const user = await verifyToken(req);

    // ✅ Optional: Ensure only cleaners can accept orders
    if (user.userType !== 'cleaner') {
      return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
    }

    // 🎯 Your booking update logic here (update booking as accepted)
    // Example: You can update the booking document here if needed

    return NextResponse.json({ success: true, message: 'Order accepted.' });
  } catch (err) {
    console.error('❌ Booking acceptance error:', err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 401 });
  }
}
