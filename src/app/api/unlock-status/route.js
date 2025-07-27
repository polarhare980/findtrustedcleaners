import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';
import { protectApiRoute } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req) {
  const { valid, user, response } = await protectApiRoute(req);
  if (!valid || user.type !== 'client') return response;

  try {
    const { cleanerId } = await req.json();

    if (!cleanerId) {
      return NextResponse.json({ success: false, message: 'Missing cleaner ID' }, { status: 400 });
    }

    await connectToDatabase();

    const purchase = await Purchase.findOne({
      cleanerId,
      clientId: user._id, // ✅ MATCH ON ID NOT EMAIL
      status: { $in: ['pending_approval', 'confirmed'] }, // ✅ Global unlock match
    });

    return NextResponse.json({ success: true, unlocked: !!purchase });
  } catch (err) {
    console.error('🔐 Unlock Check Failed:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
