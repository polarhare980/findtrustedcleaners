// File: src/app/api/unlock-status/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';
import { protectApiRoute } from '@/lib/auth';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
// Optional (helps avoid static optimization issues):
export const dynamic = 'force-dynamic';

export async function POST(req) {
  // Auth: must be a logged-in client
  const { valid, user, response } = await protectApiRoute(req, 'client');
  if (!valid || !user || user.type !== 'client') {
    // Ensure JSON on auth failure (protectApiRoute may already be a JSON response)
    return response || NextResponse.json(
      { success: false, unlocked: false, message: 'Unauthorised' },
      { status: 401 }
    );
  }

  try {
    // Safely parse body
    const body = await req.json().catch(() => ({}));
    const { cleanerId } = body || {};

    if (!cleanerId) {
      return NextResponse.json(
        { success: false, unlocked: false, message: 'Missing cleanerId' },
        { status: 400 }
      );
    }

    // Validate ObjectIds without throwing
    const clientIdStr = String(user._id || '');
    const cleanerIdStr = String(cleanerId || '');

    if (
      !mongoose.Types.ObjectId.isValid(clientIdStr) ||
      !mongoose.Types.ObjectId.isValid(cleanerIdStr)
    ) {
      return NextResponse.json(
        { success: false, unlocked: false, message: 'Invalid id format' },
        { status: 400 }
      );
    }

    const clientObjectId = new mongoose.Types.ObjectId(clientIdStr);
    const cleanerObjectId = new mongoose.Types.ObjectId(cleanerIdStr);

    await connectToDatabase();

    // Consider only confirmed as unlocked. If you want pending_approval to count, include it.
    const purchase = await Purchase.findOne({
      cleanerId: cleanerObjectId,
      clientId: clientObjectId,
      status: { $in: ['confirmed'] }, // or ['pending_approval','confirmed'] if needed
    })
      .select('_id status')
      .lean();

    const unlocked = !!purchase;

    return NextResponse.json(
      { success: true, unlocked },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('🔐 unlock-status error:', err);
    // ALWAYS return JSON on error
    return NextResponse.json(
      { success: false, unlocked: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Optional: method guard for other verbs
export async function GET() {
  return NextResponse.json(
    { success: false, unlocked: false, message: 'Method Not Allowed' },
    { status: 405 }
  );
}
