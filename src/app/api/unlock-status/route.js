import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';
import { protectApiRoute } from '@/lib/auth';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

export async function POST(req) {
  const { valid, user, response } = await protectApiRoute(req);
  if (!valid || user.type !== 'client') return response;

  try {
    const { cleanerId } = await req.json();

    if (!cleanerId) {
      return NextResponse.json({ success: false, message: 'Missing cleanerId' }, { status: 400 });
    }

    const clientObjectId = new mongoose.Types.ObjectId(user._id);
    const cleanerObjectId = new mongoose.Types.ObjectId(cleanerId);

    console.log('🔍 Checking purchase with:');
    console.log('clientId:', clientObjectId.toString());
    console.log('cleanerId:', cleanerObjectId.toString());

    await connectToDatabase();

    const purchase = await Purchase.findOne({
      cleanerId: cleanerObjectId,
      clientId: clientObjectId,
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
