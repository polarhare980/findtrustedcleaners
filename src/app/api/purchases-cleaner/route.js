import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase'; // match filename/case exactly

export async function GET(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response; // JSON 401/403, not HTML

  if (user.type !== 'cleaner' && user.type !== 'admin') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const cleanerId = user.type === 'cleaner' ? String(user._id) : null;

  try {
    const filter =
      user.type === 'admin'
        ? { status: 'pending' }
        : { cleanerId, status: 'pending' };

    const purchases = await Purchase.find(filter)
      .select('_id status day hour cleanerId clientId createdAt')
      .lean();

    console.log('API /purchases-cleaner →', {
      who: user.type,
      count: purchases.length,
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
