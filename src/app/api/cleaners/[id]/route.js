// File: src/app/api/cleaners/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Cleaner from '@/models/Cleaner';
import Purchase from '@/models/Purchase';

/* ------------------------------ Utilities ------------------------------ */

// 🧼 Contact Info Scrubber (keeps bio clean for public profiles)
function containsContactInfo(text, cleaner) {
  if (!text) return false;
  const patterns = [
    /\b\d{5,}\b/g,                // long digit blocks (phones)
    /\b\S+@\S+\.\S+\b/g,          // emails
    /(https?:\/\/|www\.)\S+/gi,   // URLs
    /\.com\b|\.co\.uk\b|\.net\b|\.org\b/gi, // TLDs
    /\b(ltd|cleaning|services)\b/gi // common company words
  ];

  const norm = (s) => String(s || '').toLowerCase();
  const hay = norm(text);

  if (cleaner) {
    if (norm(cleaner.email) && hay.includes(norm(cleaner.email))) return true;
    if (norm(cleaner.companyName) && hay.includes(norm(cleaner.companyName))) return true;
    if (norm(cleaner.phone) && hay.includes(norm(cleaner.phone))) return true;
  }

  return patterns.some((re) => re.test(hay));
}

// ✅ tiny helper to sanitize photos array
function sanitizePhotos(photos) {
  if (!Array.isArray(photos)) return [];
  return photos
    .map((p) => {
      if (!p) return null;
      if (typeof p === 'string') return { url: p, public_id: undefined, hasText: false };
      const url = typeof p.url === 'string' ? p.url : '';
      if (!url) return null;
      return {
        url,
        public_id: typeof p.public_id === 'string' ? p.public_id : undefined,
        hasText: !!p.hasText,
      };
    })
    .filter(Boolean);
}

/** Ensure YYYY-MM-DD */
function isISODate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** Only allow hour keys 7..19, values true | false | 'unavailable' */
function sanitizeAvailabilityOverrides(input) {
  if (!input || typeof input !== 'object') return undefined;
  const out = {};
  for (const [iso, dayMap] of Object.entries(input)) {
    if (!isISODate(iso)) continue;
    if (!dayMap || typeof dayMap !== 'object') continue;
    const cleaned = {};
    for (const [hour, val] of Object.entries(dayMap)) {
      const hNum = Number(hour);
      if (!Number.isInteger(hNum) || hNum < 7 || hNum > 19) continue;
      if (val === true || val === false || val === 'unavailable') {
        cleaned[String(hNum)] = val;
      }
    }
    if (Object.keys(cleaned).length > 0) out[iso] = cleaned;
  }
  return Object.keys(out).length > 0 ? out : {};
}

/* --------------------------------- PUT ---------------------------------- */
/**
 * PUT /api/cleaners/[id]
 * Update cleaner fields (whitelisted). Ensures booleans are saved correctly.
 */
export async function PUT(req, { params }) {
  await connectToDatabase();
  const { id } = params;

  // Auth (must be the same cleaner or an admin)
  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;
  if (String(user?._id) !== String(id) && user?.type !== 'admin') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const cleaner = await Cleaner.findById(id);
    if (!cleaner) {
      return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
    }

    const updateFields = {};

    // ✅ Bio (sanitise)
    if (body.bio !== undefined) {
      if (containsContactInfo(body.bio, cleaner)) {
        return NextResponse.json(
          { success: false, message: 'Bio contains contact info or company references. Please remove them.' },
          { status: 400 }
        );
      }
      updateFields.bio = String(body.bio || '').trim();
    }

    // ✅ Core fields
    if (body.availability !== undefined) updateFields.availability = body.availability;
    if (body.googleReviewUrl !== undefined) updateFields.googleReviewUrl = body.googleReviewUrl;
    if (body.googleReviewRating !== undefined) updateFields.googleReviewRating = body.googleReviewRating;
    if (body.googleReviewCount !== undefined) updateFields.googleReviewCount = body.googleReviewCount;
    if (body.facebookReviewUrl !== undefined) updateFields.facebookReviewUrl = body.facebookReviewUrl;
    if (body.embedCode !== undefined) updateFields.embedCode = body.embedCode;

    if (body.image !== undefined) updateFields.image = body.image;
    if (body.imageHasText !== undefined) updateFields.imageHasText = !!body.imageHasText;
    if (body.videoUrl !== undefined) updateFields.videoUrl = body.videoUrl;

    if (body.rates !== undefined) updateFields.rates = body.rates;
    if (body.services !== undefined) updateFields.services = body.services;
    if (body.phone !== undefined) updateFields.phone = body.phone;
    if (body.email !== undefined) updateFields.email = body.email;
    if (body.companyName !== undefined) updateFields.companyName = body.companyName;
    if (body.address !== undefined) updateFields.address = body.address;
    if (body.additionalPostcodes !== undefined) updateFields.additionalPostcodes = body.additionalPostcodes;

    // ✅ Insurance boolean
    if (body.businessInsurance !== undefined) updateFields.businessInsurance = !!body.businessInsurance;

    // ✅ DBS boolean
    if (body.dbsChecked !== undefined) updateFields.dbsChecked = !!body.dbsChecked;

    // ✅ Premium toggle + dial
    if (body.isPremium !== undefined) updateFields.isPremium = !!body.isPremium;
    if (body.premiumWeeksAhead !== undefined) {
      const n = Number(body.premiumWeeksAhead);
      if (Number.isFinite(n) && n >= 0 && n <= 12) updateFields.premiumWeeksAhead = Math.floor(n);
    }

    // ✅ Structured services with durations
    if (body.servicesDetailed !== undefined) {
      updateFields.servicesDetailed = (body.servicesDetailed || []).map((svc) => ({
        ...svc,
        name: String(svc.name || '').trim(),
        key: String(svc.key || '').trim(),
        active: svc?.active !== false,
        defaultDurationMins: Number(svc.defaultDurationMins) || 60,
        minDurationMins: Number(svc.minDurationMins) || 60,
        maxDurationMins: Number(svc.maxDurationMins) || 240,
        incrementMins: Number(svc.incrementMins) || 60,
        bufferBeforeMins: Number(svc.bufferBeforeMins) || 0,
        bufferAfterMins: Number(svc.bufferAfterMins) || 0,
        basePrice: svc.basePrice !== undefined ? Number(svc.basePrice) : undefined,
        pricePerHour: svc.pricePerHour !== undefined ? Number(svc.pricePerHour) : undefined,
      }));
    }

    // ✅ NEW: Gallery photos
    if (body.photos !== undefined) {
      updateFields.photos = sanitizePhotos(body.photos);
    }

    // ✅ NEW: Date-specific overrides (week independence)
    if (body.availabilityOverrides !== undefined) {
      const cleaned = sanitizeAvailabilityOverrides(body.availabilityOverrides);
      // Store as plain object; Mongoose Map will accept and cast
      updateFields.availabilityOverrides = cleaned || {};
    }

    const updated = await Cleaner.findByIdAndUpdate(id, updateFields, { new: true });
    return NextResponse.json({ success: true, cleaner: updated });
  } catch (err) {
    console.error('❌ Cleaner update error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

/* ---------------------------------- GET --------------------------------- */
/**
 * GET /api/cleaners/[id]
 * Public profile fetch. Includes flags needed for badges.
 * If the viewer is a client who has purchased, reveal contact details.
 * Also returns availabilityOverrides so the client UI can compose per-week calendars.
 */
export async function GET(req, { params }) {
  await connectToDatabase();
  const { id } = params;

  try {
    const cleaner = await Cleaner.findById(id).lean();
    if (!cleaner) {
      return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
    }

    // Public shape (include flags for badges + overrides for week composition)
    const publicData = {
      _id: cleaner._id,
      realName: cleaner.realName,
      companyName: cleaner.companyName,
      postcode: cleaner.address?.postcode,
      rates: cleaner.rates,
      services: cleaner.services,
      servicesDetailed: cleaner.servicesDetailed || [],
      availability: cleaner.availability || {},
      availabilityOverrides: cleaner.availabilityOverrides || {}, // 👈 important
      image: cleaner.image || '/default-avatar.png',
      imageHasText: !!cleaner.imageHasText,
      bio: cleaner.bio || '',
      businessInsurance: !!cleaner.businessInsurance,
      dbsChecked: !!cleaner.dbsChecked,
      isPremium: !!cleaner.isPremium,
      premiumWeeksAhead: typeof cleaner.premiumWeeksAhead === 'number' ? cleaner.premiumWeeksAhead : 3,
      googleReviewUrl: cleaner.googleReviewUrl || null,
      googleReviewRating: cleaner.googleReviewRating || null,
      googleReviewCount: cleaner.googleReviewCount || 0,
      facebookReviewUrl: cleaner.facebookReviewUrl || null,
      // ✅ include gallery + video
      photos: Array.isArray(cleaner.photos) ? cleaner.photos : [],
      videoUrl: cleaner.videoUrl || null,
    };

    let responseData = { ...publicData };
    let hasAccess = false;

    // If a logged-in client has a purchase, reveal contact details
    const { valid, user } = await protectApiRoute(req);
    if (valid && user?.type === 'client') {
      const purchase = await Purchase.findOne({
        clientId: user._id?.toString(),
        cleanerId: id,
      }).lean();

      if (purchase) {
        hasAccess = true;
        responseData = {
          ...publicData,
          phone: cleaner.phone,
          email: cleaner.email,
        };
      }
    }

    return NextResponse.json({ success: true, cleaner: responseData, hasAccess });
  } catch (err) {
    console.error('❌ Error fetching cleaner:', err);
    return NextResponse.json({ success: false, message: 'Error fetching cleaner' }, { status: 500 });
  }
}
