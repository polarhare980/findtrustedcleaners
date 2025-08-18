import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cleaner from '@/models/Cleaner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(_req, { params }) {
  await dbConnect();

  const id = params?.id;
  if (!id) return json({ success: false, message: 'Cleaner id required.' }, 400);

  // Only expose public-safe fields
  const projection = {
    realName: 1,
    companyName: 1,
    image: 1,
    imageHasText: 1,
    photos: 1,
    isPremium: 1,
    businessInsurance: 1,
    dbsChecked: 1,
    rates: 1,
    bio: 1,
    availability: 1,
    services: 1,
    servicesDetailed: 1,
    address: 1,            // includes postcode
    additionalPostcodes: 1,
    googleReviewUrl: 1,
    googleReviewRating: 1,
    googleReviewCount: 1,
    videoUrl: 1,
    createdAt: 1,
  };

  try {
    const c = await Cleaner.findById(id, projection).lean();
    if (!c) return json({ success: false, message: 'Cleaner not found.' }, 404);

    const cleaner = {
      _id: String(c._id),
      realName: c.realName || '',
      companyName: c.companyName || '',
      image: c.image || '',
      imageHasText: !!c.imageHasText,
      photos: Array.isArray(c.photos)
        ? c.photos.map((p) => ({
            url: p?.url || '',
            public_id: p?.public_id || '',
            hasText: !!p?.hasText,
          }))
        : [],
      isPremium: !!c.isPremium,
      businessInsurance: !!c.businessInsurance,
      dbsChecked: !!c.dbsChecked,
      rates: typeof c.rates === 'number' ? c.rates : null,
      bio: typeof c.bio === 'string' ? c.bio : '',
      availability: c.availability || {},

      // Simple tags (keep as-is for filters)
      services: Array.isArray(c.services) ? c.services : [],

      // Detailed services for span-aware booking UI
      servicesDetailed: Array.isArray(c.servicesDetailed)
        ? c.servicesDetailed.map((s) => ({
            key: (s?.key || '').toString().trim().toLowerCase(),
            name: s?.name || '',
            active: s?.active !== false,
            defaultDurationMins: numOrFallback(s?.defaultDurationMins, 60),
            minDurationMins: numOrFallback(s?.minDurationMins, 60),
            maxDurationMins: numOrFallback(s?.maxDurationMins, 240),
            incrementMins: numOrFallback(s?.incrementMins, 60),
            bufferBeforeMins: numOrFallback(s?.bufferBeforeMins, 0),
            bufferAfterMins: numOrFallback(s?.bufferAfterMins, 0),
            basePrice: optNum(s?.basePrice),
            pricePerHour: optNum(s?.pricePerHour),
          }))
        : [],

      address: {
        houseNameNumber: c?.address?.houseNameNumber || '',
        street: c?.address?.street || '',
        county: c?.address?.county || '',
        postcode: c?.address?.postcode || '',
      },
      additionalPostcodes: Array.isArray(c.additionalPostcodes) ? c.additionalPostcodes : [],

      // Normalise legacy google review fields into a single object
      googleReviews: {
        url: c?.googleReviewUrl || '',
        rating: typeof c?.googleReviewRating === 'number' ? c.googleReviewRating : null,
        count: typeof c?.googleReviewCount === 'number' ? c.googleReviewCount : null,
      },

      videoUrl: c?.videoUrl || '',
      createdAt: c?.createdAt || null,
    };

    const res = json({ success: true, cleaner });
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('Vary', 'Accept-Encoding');
    return res;
  } catch (error) {
    console.error('API error fetching cleaner:', error);
    return json({ success: false, message: 'Server error' }, 500);
  }
}

/* ---------------- helpers ---------------- */

function numOrFallback(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function optNum(v) {
  if (v === '' || v === null || typeof v === 'undefined') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
