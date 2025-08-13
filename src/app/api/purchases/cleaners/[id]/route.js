import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase'; // <-- make sure file name/case matches your models folder

export async function GET(req, { params }) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response; // returns JSON 401/403 (not HTML)

  const cleanerId = params.id;
  const isSelf = user.type === 'cleaner' && String(user._id) === String(cleanerId);
  const isAdmin = user.type === 'admin';
  if (!isSelf && !isAdmin) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const purchases = await Purchase.find({ cleanerId, status: 'pending' })
      .select('_id status day hour cleanerId clientId createdAt')
      .lean();

    // Debug in server logs
    console.log('API /purchases/cleaner/:id →', {
      cleanerId,
      pendingCount: purchases.length,
      sample: purchases.slice(0, 3).map(p => ({
        id: p._id, status: p.status, day: p.day, hour: String(p.hour)
      })),
    });

    return NextResponse.json({ success: true, purchases });
  } catch (err) {
    console.error('❌ Fetch Cleaner Purchases Error:', err);
    return NextResponse.json({ success: false, message: 'Error fetching purchases' }, { status: 500 });
  }
}
