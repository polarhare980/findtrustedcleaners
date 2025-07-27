import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';
import { protectApiRoute } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req) {
  const { valid, user, response } = await protectApiRoute(req);
  if (!valid || user.type !== 'client') return response;

  try {
    const { cleanerId, day, hour } = await req.json();

    if (!cleanerId || !day || !hour) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    await connectToDatabase();

    const purchase = await Purchase.findOne({
      cleanerId,
      clientId: user._id, // ✅ MATCH ON ID NOT EMAIL
      day,
      hour,
      status: { $in: ['pending_approval', 'confirmed'] },
    });

    return NextResponse.json({ success: true, unlocked: !!purchase });
  } catch (err) {
    console.error('🔐 Unlock Check Failed:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
