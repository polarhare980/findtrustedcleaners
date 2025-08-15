import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';

export async function GET(_req, { params }) {
  try {
    await connectToDatabase();
    const cleanerId = params.id;

    // Only expose non-sensitive fields
    const rows = await Purchase.find({
      cleanerId,
      status: 'pending_approval',
    })
      .select('day hour status') // no clientId, no PII
      .lean();

    const res = NextResponse.json({ success: true, purchases: rows || [] });
    // Small public cache to reduce DB hits (tweak to taste)
    res.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60');
    return res;
  } catch (err) {
    console.error('GET /api/public/purchases/cleaners/:id error', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
