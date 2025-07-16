// app/api/unlock-status/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';

export const runtime = 'nodejs'; // Ensure full Node support

export async function POST(req) {
  try {
    const { cleanerId, clientEmail, day, hour } = await req.json();

    if (!cleanerId || !clientEmail || !day || !hour) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    await connectToDatabase();

    const purchase = await Purchase.findOne({
      cleanerId,
      clientId: clientEmail,
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
