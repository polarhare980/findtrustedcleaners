import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';

/**
 * Public endpoint: returns only minimal, non-sensitive info
 * about pending bookings for a given cleaner.
 * Response: { success: true, purchases: [{ _id, status, day, hour }] }
 */
export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    const cleanerId = params.id;

    // Only expose pending-like statuses
    const purchases = await Purchase.find({
      cleanerId,
      status: { $in: ['pending', 'pending_approval'] },
    })
      .select('_id status day hour')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, purchases });
  } catch (err) {
    console.error('❌ Public purchases error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
