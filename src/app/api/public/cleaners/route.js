// File: src/app/api/public/cleaners/route.js
// Alias shim to keep backward compatibility with older clients.
// Mirrors /api/public-cleaners
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();

    const cleaners = await Cleaner.find({})
      .select([
        'realName',
        'companyName',
        'email',
        'phone',
        'image',
        'imageHasText',
        'photos',
        'isPremium',
        'premiumWeeksAhead',
        'businessInsurance',
        'dbsChecked',
        'googleReviewRating',
        'googleReviewCount',
        'availability',
      ].join(' '))
      .lean();

    return NextResponse.json({ success: true, cleaners });
  } catch (err) {
    console.error('GET /api/public/cleaners error:', err);
    return NextResponse.json({ success: false, cleaners: [], message: 'Server error' }, { status: 500 });
  }
}
