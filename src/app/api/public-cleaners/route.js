import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function firstPhotoUrl(photos) {
  if (!Array.isArray(photos)) return '';
  for (const photo of photos) {
    if (!photo) continue;
    if (typeof photo === 'string' && photo.trim()) return photo.trim();
    const url = photo.url || photo.secure_url || photo.secureUrl || photo.src || '';
    if (typeof url === 'string' && url.trim()) return url.trim();
  }
  return '';
}

function resolveCleanerImage(cleaner) {
  const directImage = typeof cleaner?.image === 'string' ? cleaner.image.trim() : '';
  if (directImage) return directImage;

  const legacyProfileImage = typeof cleaner?.profileImage === 'string' ? cleaner.profileImage.trim() : '';
  if (legacyProfileImage) return legacyProfileImage;

  const galleryImage = firstPhotoUrl(cleaner?.photos);
  if (galleryImage) return galleryImage;

  return '';
}

export async function GET() {
  try {
    await connectToDatabase();
    const raw = await Cleaner.find({})
      .select(['realName','companyName','rates','services','servicesDetailed','image','profileImage','photos','isPremium','businessInsurance','dbsChecked','googleReviewRating','googleReviewCount','availability','availabilityOverrides','address'].join(' '))
      .lean();

    const cleaners = raw.map((c) => ({
      ...c,
      _id: c?._id ? String(c._id) : undefined,
      image: resolveCleanerImage(c),
      availability: c?.availability || {},
      availabilityOverrides: c?.availabilityOverrides || {},
      address: c?.address || {},
    }));

    return NextResponse.json({ success: true, cleaners });
  } catch (err) {
    console.error('GET /api/public-cleaners error:', err);
    return NextResponse.json({ success: false, cleaners: [], message: 'Server error' }, { status: 500 });
  }
}
