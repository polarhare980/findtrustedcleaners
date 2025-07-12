import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase';
import Client from '@/models/Client';

export async function GET(req, { params }) {
  await connectToDatabase();
  const cleanerId = params.id;

  const { valid, user, response } = await protectRoute(req);
  if (!valid) return response;

  // Only the logged-in cleaner or admin can access
  if (String(user._id) !== cleanerId && user.type !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const pendingPurchases = await Purchase.find({
      cleanerId,
      status: 'pending',
    }).populate('clientId', 'fullName email phone');

    return NextResponse.json({ success: true, bookings: pendingPurchases });
  } catch (err) {
    console.error('❌ Failed to fetch pending approvals:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
