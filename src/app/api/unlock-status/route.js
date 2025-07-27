import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';
import { protectApiRoute } from '@/lib/auth';

export const runtime = 'nodejs'; // Required for backend DB access

export async function POST(req) {
  const { valid, user, response } = await protectApiRoute(req);
  if (!valid || user.type !== 'client') return response;

  try {
    const { cleanerId } = await req.json();

    if (!cleanerId) {
      return NextResponse.json({ success: false, message: 'Missing cleaner ID' }, { status: 400 });
    }

    await connectToDatabase();

    const query = {
      cleanerId: cleanerId.toString(), // ✅ Force string match
      clientId: user._id.toString(),   // ✅ Force string match
      status: { $in: ['pending_approval', 'confirmed'] },
    };

    console.log('🔍 Running unlock-status query:', query);

    const purchase = await Purchase.findOne(query);

    if (!purchase) {
      console.warn('🔐 No purchase found for provided cleaner/client');
    }

    return NextResponse.json({ success: true, unlocked: !!purchase });
  } catch (err) {
    console.error('🔐 Unlock Check Failed:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
