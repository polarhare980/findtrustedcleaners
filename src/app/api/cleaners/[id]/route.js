import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Cleaner from '@/models/Cleaner';
import Purchase from '@/models/Purchase';

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

  // also block their own email/phone/company if present
  if (cleaner) {
    if (norm(cleaner.email) && hay.includes(norm(cleaner.email))) return true;
    if (norm(cleaner.companyName) && hay.includes(norm(cleaner.companyName))) return true;
    if (norm(cleaner.phone) && hay.includes(norm(cleaner.phone))) return true;
  }

  return patterns.some((re) => re.test(hay));
}

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

    // ✅ Core fields (copy through if provided)
    if (body.availability !== undefined) updateFields.availability = body.availability;
    if (body.googleReviewUrl !== undefined) updateFields.googleReviewUrl = body.googleReviewUrl;
    if (body.googleReviewRating !== undefined) updateFields.googleReviewRating = body.googleReviewRating;
    if (body.googleReviewCount !== undefined) updateFields.googleReviewCount = body.googleReviewCount;
    if (body.facebookReviewUrl !== undefined) updateFields.facebookReviewUrl = body.facebookReviewUrl;
    if (body.embedCode !== undefined) updateFields.embedCode = body.embedCode;
    if (body.image !== undefined) updateFields.image = body.image;
    if (body.rates !== undefined) updateFields.rates = body.rates;
    if (body.services !== undefined) updateFields.services = body.services;
    if (body.phone !== undefined) updateFields.phone = body.phone;
    if (body.email !== undefined) updateFields.email = body.email;
    if (body.companyName !== undefined) updateFields.companyName = body.companyName;
    if (body.address !== undefined) updateFields.address = body.address;
    if (body.additionalPostcodes !== undefined) updateFields.additionalPostcodes = body.additionalPostcodes;

    // ✅ Insurance boolean (already worked before)
    if (body.businessInsurance !== undefined) updateFields.businessInsurance = !!body.businessInsurance;

    // ✅ NEW: DBS boolean must be explicitly whitelisted
    if (body.dbsChecked !== undefined) updateFields.dbsChecked = !!body.dbsChecked;

    // ✅ Optional: allow toggling premium flag if your UI needs it
    if (body.isPremium !== undefined) updateFields.isPremium = !!body.isPremium;

    const updated = await Cleaner.findByIdAndUpdate(id, updateFields, { new: true });
    return NextResponse.json({ success: true, cleaner: updated });
  } catch (err) {
    console.error('❌ Cleaner update error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

/**
 * GET /api/cleaners/[id]
 * Public profile fetch. Includes flags needed for badges.
 * If the viewer is a client who has purchased, reveal contact details.
 */
export async function GET(req, { params }) {
  await connectToDatabase();
  const { id } = params;

  try {
    const cleaner = await Cleaner.findById(id).lean();
    if (!cleaner) {
      return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
    }

    // Public shape (include flags for badges)
    const publicData = {
      _id: cleaner._id,
      realName: cleaner.realName,
      companyName: cleaner.companyName, // harmless publicly
      postcode: cleaner.address?.postcode,
      rates: cleaner.rates,
      services: cleaner.services,
      availability: cleaner.availability || {},
      image: cleaner.image || '/default-avatar.png',
      bio: cleaner.bio || '',
      // ✅ badges
      businessInsurance: !!cleaner.businessInsurance,
      dbsChecked: !!cleaner.dbsChecked,
      isPremium: !!cleaner.isPremium,
      // Reviews (already public)
      googleReviewUrl: cleaner.googleReviewUrl || null,
      googleReviewRating: cleaner.googleReviewRating || null,
      googleReviewCount: cleaner.googleReviewCount || 0,
      facebookReviewUrl: cleaner.facebookReviewUrl || null,
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
