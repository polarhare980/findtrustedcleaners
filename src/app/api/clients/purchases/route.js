// /app/api/clients/purchases/route.js

import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';
import { protectApiRoute } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  if (user.type !== 'client') {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const purchases = await Purchase.find({ clientId: user._id })
      .sort({ createdAt: -1 })
      .populate('cleanerId', 'realName companyName') // 🔥 Get cleaner details
      .lean();

    return NextResponse.json({ success: true, purchases });
  } catch (err) {
    console.error('❌ Failed to fetch purchases:', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
