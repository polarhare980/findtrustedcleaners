// File: src/app/api/public-cleaners/[id]/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Cleaner from '@/models/Cleaner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

// Tolerate legacy photo shapes
function normalizePhotos(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((p) => {
      if (!p) return null;
      if (typeof p === 'string') return { url: p, public_id: '', hasText: false };
      const url = p.url || p.secure_url || p.secureUrl || p.src || '';
      if (!url) return null;
      return {
        url,
        public_id: p.public_id || '',
        hasText: !!p.hasText,
      };
    })
    .filter(Boolean);
}

export async function GET(_req, { params }) {
  await dbConnect();

  const id = params?.id;
  if (!id) return json({ success: false, message: 'Cleaner id required.' }, 400);

  // ✅ Prevent Mongoose CastError → 500
  if (!mongoose.isValidObjectId(id)) {
    return json({ success: false, message: 'Invalid cleaner id.' }, 400);
  }

  // Only expose public-safe fields
  const projection = {
    realName: 1,
    companyName: 1,
    image: 1,
    imageHasText: 1,
    photos: 1,
    isPremium: 1,
    premiumWeeksAhead: 1,
    businessInsurance: 1,
    dbsChecked: 1,
    rates: 1,
    bio: 1,
    availability: 1,
    availabilityOverrides: 1,
    services: 1,
    servicesDetailed: 1,
    address: 1,
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
      // ✅ normalised photos so gallery renders even with legacy keys
      photos: normalizePhotos(c.photos),
      isPremium: !!c.isPremium,
      premiumWeeksAhead: typeof c.premiumWeeksAhead === 'number' ? c.premiumWeeksAhead : 3,
      businessInsurance: !!c.businessInsurance,
      dbsChecked: !!c.dbsChecked,
      rates: typeof c.rates === 'number' ? c.rates : null,
      bio: typeof c.bio === 'string' ? c.bio : '',
      availability: c.availability || {},
      availabilityOverrides: normalizeOverrides(c.availabilityOverrides),
      services: Array.isArray(c.services) ? c.services : [],
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
    console.error('API error fetching cleaner:', error?.name, error?.message);
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

function normalizeOverrides(overrides) {
  if (!overrides) return {};
  const out = {};
  for (const iso in overrides) {
    if (!Object.prototype.hasOwnProperty.call(overrides, iso)) continue;
    const dayMap = overrides[iso] || {};
    if (!dayMap || typeof dayMap !== 'object') continue;
    const cleaned = {};
    for (const hour in dayMap) {
      if (!Object.prototype.hasOwnProperty.call(dayMap, hour)) continue;
      const v = dayMap[hour];
      if (v === true || v === false || v === 'unavailable') {
        cleaned[String(Number(hour))] = v;
      }
    }
    if (Object.keys(cleaned).length > 0) out[iso] = cleaned;
  }
  return out;
}
