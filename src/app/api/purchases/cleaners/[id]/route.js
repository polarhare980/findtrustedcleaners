import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase';

export async function GET(req, { params }) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  const cleanerId = params.id;
  const isSelf = user.type === 'cleaner' && String(user._id) === String(cleanerId);
  const isAdmin = user.type === 'admin';
  if (!isSelf && !isAdmin) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const purchases = await Purchase.find({
      cleanerId,
      status: 'pending_approval',           // <-- important
    })
      .select('_id status day hour cleanerId clientId createdAt') // keep lean
      .lean();

    console.log('API /purchases/cleaners/:id →', {
      cleanerId,
      pendingCount: purchases.length,
      sample: purchases.slice(0, 3).map(p => ({
        id: p._id, status: p.status, day: p.day, hour: String(p.hour)
      })),
    });

    return NextResponse.json({ success: true, purchases });
  } catch (err) {
    console.error('❌ Fetch Cleaner Purchases Error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
