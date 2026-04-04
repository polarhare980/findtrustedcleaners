import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();

    // Expose only safe, public fields
    const raw = await Cleaner.find({})
      .select(
        [
          'realName',
          'companyName',
          'rates',
          'services',
          'image',
          'isPremium',
          'businessInsurance',
          'dbsChecked',
          'googleReviewRating',
          'googleReviewCount',
          'availability',
          'availabilityOverrides',
        ].join(' ')
      )
      .lean();

    // Ensure _id is always a plain string for routing/links
    const cleaners = raw.map((c) => ({
      ...c,
      _id: c?._id ? String(c._id) : undefined,
      availability: c?.availability || {},
      availabilityOverrides: c?.availabilityOverrides || {},
    }));

    return NextResponse.json({ success: true, cleaners });
  } catch (err) {
    console.error('GET /api/public-cleaners error:', err);
    return NextResponse.json(
      { success: false, cleaners: [], message: 'Server error' },
      { status: 500 }
    );
  }
}