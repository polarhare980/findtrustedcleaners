// File: src/app/api/public/purchases/cleaners/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  try {
    const cleanerId = params?.id;
    if (!cleanerId) {
      return NextResponse.json(
        { success: false, purchases: [], message: 'Missing cleaner id' },
        { status: 400 }
      );
    }

    // Validate ObjectId (avoid cast errors)
    if (!mongoose.Types.ObjectId.isValid(String(cleanerId))) {
      return NextResponse.json(
        { success: false, purchases: [], message: 'Invalid cleaner id' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Expose only non-sensitive fields
    const rows = await Purchase.find({
      cleanerId,
      status: { $in: ['pending', 'pending_approval'] },
    })
      .select('day hour status') // no clientId, no PII
      .lean();

    const res = NextResponse.json({ success: true, purchases: rows || [] });
    // Small public cache to reduce DB hits (adjust as needed)
    res.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60');
    res.headers.set('Vary', 'Accept-Encoding'); // friendly for CDNs
    return res;
  } catch (err) {
    console.error('GET /api/public/purchases/cleaners/:id error', err);
    return NextResponse.json(
      { success: false, purchases: [], message: 'Server error' },
      { status: 500 }
    );
  }
}
