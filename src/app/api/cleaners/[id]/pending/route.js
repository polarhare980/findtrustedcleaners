import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase'; // ensure filename/case matches

export async function GET(req, { params }) {
  await connectToDatabase();
  const cleanerId = params.id;

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  // Only the logged-in cleaner or admin can access
  const isSelf = String(user._id) === String(cleanerId) && user.type === 'cleaner';
  const isAdmin = user.type === 'admin';
  if (!isSelf && !isAdmin) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const purchases = await Purchase.find({
      cleanerId,
      status: 'pending',
    })
      .select('_id status day hour cleanerId clientId createdAt')
      .lean();

    // Debug
    console.log('API /purchases/cleaner/:id →', {
      cleanerId,
      pendingCount: purchases.length,
      sample: purchases.slice(0, 3).map(p => ({
        id: p._id, status: p.status, day: p.day, hour: String(p.hour)
      })),
    });

    return NextResponse.json({ success: true, purchases });
  } catch (err) {
    console.error('❌ Failed to fetch pending approvals:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
