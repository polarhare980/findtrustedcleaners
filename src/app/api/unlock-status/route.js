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

    const clientId = user._id.toString();
    const cleanerIdStr = cleanerId.toString();

    console.log('🔍 Checking purchase with:');
    console.log('clientId:', clientId);
    console.log('cleanerId:', cleanerIdStr);

    await connectToDatabase();

    const purchase = await Purchase.findOne({
      cleanerId: cleanerIdStr,
      clientId: clientId,
      status: { $in: ['pending_approval', 'confirmed'] },
    });

    if (!purchase) {
      console.warn('❌ No matching purchase found in DB');
    } else {
      console.log('✅ Matching purchase found:', purchase._id);
    }

    return NextResponse.json({ success: true, unlocked: !!purchase });
  } catch (err) {
    console.error('🔐 Unlock Check Failed:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
