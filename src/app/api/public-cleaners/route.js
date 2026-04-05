import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const raw = await Cleaner.find({})
      .select(['realName','companyName','rates','services','servicesDetailed','image','isPremium','businessInsurance','dbsChecked','googleReviewRating','googleReviewCount','availability','availabilityOverrides','address'].join(' '))
      .lean();

    const cleaners = raw.map((c) => ({ ...c, _id: c?._id ? String(c._id) : undefined, availability: c?.availability || {}, availabilityOverrides: c?.availabilityOverrides || {}, address: c?.address || {} }));
    return NextResponse.json({ success: true, cleaners });
  } catch (err) {
    console.error('GET /api/public-cleaners error:', err);
    return NextResponse.json({ success: false, cleaners: [], message: 'Server error' }, { status: 500 });
  }
}
