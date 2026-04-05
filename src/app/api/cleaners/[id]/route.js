import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Purchase from '@/models/Purchase';
import Booking from '@/models/booking';
import { protectApiRoute } from '@/lib/auth';
import { NextResponse } from 'next/server';

function containsContactInfo(text, cleaner) {
  if (!text) return false;
  const patterns = [/\d{5,}/g, /\S+@\S+\.\S+/g, /(https?:\/\/|www\.)\S+/gi, /\.com|\.co\.uk|\.net|\.org/gi, /(ltd|cleaning|services)/gi];
  const norm = (s) => String(s || '').toLowerCase();
  const hay = norm(text);
  if (cleaner) {
    if (norm(cleaner.email) && hay.includes(norm(cleaner.email))) return true;
    if (norm(cleaner.companyName) && hay.includes(norm(cleaner.companyName))) return true;
    if (norm(cleaner.phone) && hay.includes(norm(cleaner.phone))) return true;
  }
  return patterns.some((re) => re.test(hay));
}

function sanitizePhotos(photos) {
  if (!Array.isArray(photos)) return [];
  return photos.map((p) => {
    if (!p) return null;
    if (typeof p === 'string') return { url: p, public_id: undefined, hasText: false };
    const url = typeof p.url === 'string' ? p.url : '';
    if (!url) return null;
    return { url, public_id: typeof p.public_id === 'string' ? p.public_id : undefined, hasText: !!p.hasText };
  }).filter(Boolean);
}

function isISODate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }

function sanitizeAvailabilityOverrides(input) {
  if (!input || typeof input !== 'object') return undefined;
  const out = {};
  for (const [iso, dayMap] of Object.entries(input)) {
    if (!isISODate(iso) || !dayMap || typeof dayMap !== 'object') continue;
    const cleaned = {};
    for (const [hour, val] of Object.entries(dayMap)) {
      const hNum = Number(hour);
      if (!Number.isInteger(hNum) || hNum < 7 || hNum > 19) continue;
      if (val === true || val === false || val === 'unavailable') cleaned[String(hNum)] = val;
    }
    if (Object.keys(cleaned).length > 0) out[iso] = cleaned;
  }
  return Object.keys(out).length > 0 ? out : {};
}

function slugifyServiceKey(name = '') {
  return String(name).trim().toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80);
}

function sanitizeSimpleService(svc = {}) {
  const name = String(svc?.name || '').trim();
  const duration = Math.max(15, Number(svc?.defaultDurationMins) || 60);
  const priceRaw = svc?.price ?? svc?.basePrice;
  const price = priceRaw === '' || priceRaw == null ? undefined : Number(priceRaw);
  return {
    key: String(svc?.key || slugifyServiceKey(name)),
    name,
    active: svc?.active !== false,
    defaultDurationMins: duration,
    minDurationMins: duration,
    maxDurationMins: duration,
    incrementMins: 60,
    bufferBeforeMins: 0,
    bufferAfterMins: 0,
    price: Number.isFinite(price) && price >= 0 ? price : undefined,
    basePrice: Number.isFinite(price) && price >= 0 ? price : undefined,
    pricePerHour: undefined,
  };
}

export async function PUT(req, context) {
  await connectToDatabase();
  const params = await context?.params;
  const { id } = params || {};

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;
  if (String(user?._id) !== String(id) && user?.type !== 'admin') return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const cleaner = await Cleaner.findById(id);
    if (!cleaner) return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });

    const updateFields = {};
    if (body.bio !== undefined) {
      if (containsContactInfo(body.bio, cleaner)) return NextResponse.json({ success: false, message: 'Bio contains contact info or company references. Please remove them.' }, { status: 400 });
      updateFields.bio = String(body.bio || '').trim();
    }

    if (body.availability !== undefined) updateFields.availability = body.availability;
    if (body.googleReviewUrl !== undefined) updateFields.googleReviewUrl = body.googleReviewUrl;
    if (body.googleReviewRating !== undefined) updateFields.googleReviewRating = body.googleReviewRating;
    if (body.googleReviewCount !== undefined) updateFields.googleReviewCount = body.googleReviewCount;
    if (body.image !== undefined) updateFields.image = body.image;
    if (body.imageHasText !== undefined) updateFields.imageHasText = !!body.imageHasText;
    if (body.videoUrl !== undefined) updateFields.videoUrl = body.videoUrl;
    if (body.rates !== undefined) {
      const numericRate = body.rates === '' || body.rates == null ? undefined : Number(body.rates);
      updateFields.rates = Number.isFinite(numericRate) && numericRate >= 0 ? numericRate : undefined;
    }
    if (body.services !== undefined) updateFields.services = (body.services || []).map((s) => String(s).trim()).filter(Boolean);
    if (body.phone !== undefined) updateFields.phone = body.phone;
    if (body.email !== undefined) updateFields.email = body.email;
    if (body.companyName !== undefined) updateFields.companyName = body.companyName;
    if (body.address !== undefined) {
      updateFields.address = {
        houseNameNumber: String(body.address?.houseNameNumber || '').trim(),
        street: String(body.address?.street || '').trim(),
        town: String(body.address?.town || '').trim(),
        county: String(body.address?.county || '').trim(),
        postcode: String(body.address?.postcode || '').trim(),
      };
    }
    if (body.additionalPostcodes !== undefined) updateFields.additionalPostcodes = body.additionalPostcodes;
    if (body.businessInsurance !== undefined) updateFields.businessInsurance = !!body.businessInsurance;
    if (body.dbsChecked !== undefined) updateFields.dbsChecked = !!body.dbsChecked;
    if (body.isPremium !== undefined) updateFields.isPremium = !!body.isPremium;
    if (body.premiumWeeksAhead !== undefined) {
      const n = Number(body.premiumWeeksAhead);
      if (Number.isFinite(n) && n >= 0 && n <= 12) updateFields.premiumWeeksAhead = Math.floor(n);
    }
    if (body.servicesDetailed !== undefined) {
      updateFields.servicesDetailed = (body.servicesDetailed || []).map((svc) => sanitizeSimpleService(svc)).filter((svc) => svc.name);
      updateFields.services = updateFields.servicesDetailed.map((svc) => svc.name);
    }
    if (body.photos !== undefined) updateFields.photos = sanitizePhotos(body.photos);
    if (body.availabilityOverrides !== undefined) updateFields.availabilityOverrides = sanitizeAvailabilityOverrides(body.availabilityOverrides) || {};

    const updated = await Cleaner.findByIdAndUpdate(id, updateFields, { new: true });
    return NextResponse.json({ success: true, cleaner: updated });
  } catch (err) {
    console.error('❌ Cleaner update error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function GET(req, context) {
  await connectToDatabase();
  const params = await context?.params;
  const { id } = params || {};

  try {
    const cleaner = await Cleaner.findById(id).lean();
    if (!cleaner) return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });

    const publicData = {
      _id: cleaner._id,
      realName: cleaner.realName,
      companyName: cleaner.companyName,
      postcode: cleaner.address?.postcode,
      address: cleaner.address || {},
      rates: cleaner.rates,
      services: cleaner.services,
      servicesDetailed: cleaner.servicesDetailed || [],
      availability: cleaner.availability || {},
      availabilityOverrides: cleaner.availabilityOverrides || {},
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
      photos: Array.isArray(cleaner.photos) ? cleaner.photos : [],
      videoUrl: cleaner.videoUrl || null,
    };

    let responseData = { ...publicData };
    let hasAccess = false;

    const { valid, user } = await protectApiRoute(req);
    if (valid && user?.type === 'client') {
      const purchase = await Purchase.findOne({ clientId: user._id?.toString(), cleanerId: id, status: { $in: ['pending_approval', 'approved', 'accepted', 'confirmed', 'booked'] } }).lean();
      if (purchase) {
        hasAccess = true;
        responseData = { ...publicData, phone: cleaner.phone, email: cleaner.email };
      }
    }

    return NextResponse.json({ success: true, cleaner: responseData, hasAccess });
  } catch (err) {
    console.error('❌ Error fetching cleaner:', err);
    return NextResponse.json({ success: false, message: 'Error fetching cleaner' }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  await connectToDatabase();
  const params = await context?.params;
  const { id } = params || {};
  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;
  if (String(user?._id || '') !== String(id) && user?.type !== 'admin') return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

  try {
    const cleaner = await Cleaner.findById(id).lean();
    if (!cleaner) return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });

    await Promise.all([Cleaner.findByIdAndDelete(id), Purchase.deleteMany({ cleanerId: id }), Booking.deleteMany({ cleanerId: id })]);
    return NextResponse.json({ success: true, message: 'Cleaner profile deleted successfully.', deleted: { cleanerId: id } });
  } catch (err) {
    console.error('❌ Cleaner delete error:', err);
    return NextResponse.json({ success: false, message: err?.message || 'Server error.' }, { status: 500 });
  }
}
