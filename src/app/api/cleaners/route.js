// File: src/app/api/cleaners/route.js
import dbConnect from '@/lib/dbConnect';
import Cleaner from '@/models/Cleaner';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import {
  buildOutwardRegex,
  DEFAULT_SEARCH_RADIUS_MILES,
  EXPANDED_SEARCH_RADIUS_MILES,
  findBestCleanerDistanceMiles,
  parseRadiusMiles,
} from '@/lib/postcodeSearch';

function firstPhotoUrl(photos) {
  if (!Array.isArray(photos)) return '';
  for (const photo of photos) {
    if (typeof photo === 'string' && photo.trim()) return photo.trim();
    if (photo && typeof photo.url === 'string' && photo.url.trim()) return photo.url.trim();
  }
  return '';
}

function resolveCleanerImage(cleaner = {}) {
  const image = typeof cleaner?.image === 'string' ? cleaner.image.trim() : '';
  if (image) return image;

  const legacyProfileImage = typeof cleaner?.profileImage === 'string' ? cleaner.profileImage.trim() : '';
  if (legacyProfileImage) return legacyProfileImage;

  const galleryImage = firstPhotoUrl(cleaner?.photos);
  if (galleryImage) return galleryImage;

  return '/default-avatar.png';
}

function determineBookingStatus(availability = {}) {
  let hasAvailable = false;
  let hasPending = false;

  for (const day in availability) {
    for (const hour in availability[day]) {
      const val = availability[day][hour];
      const status = typeof val === 'object' ? val?.status : val;
      if (status === true || status === 'available') hasAvailable = true;
      if (status === 'pending' || status === 'pending_approval') hasPending = true;
    }
  }

  if (hasPending) return 'pending';
  if (hasAvailable) return 'available';
  return 'unavailable';
}

function buildServiceQuery(serviceType = '') {
  if (!serviceType) return null;
  return {
    $or: [
      { services: { $in: [serviceType] } },
      { servicesDetailed: { $elemMatch: { name: serviceType, active: { $ne: false } } } },
    ],
  };
}

async function applyDistanceFiltering(cleaners = [], postcode = '', radiusMiles = DEFAULT_SEARCH_RADIUS_MILES) {
  if (!postcode) {
    return cleaners.map((cleaner) => ({ ...cleaner, searchDistanceMiles: null, matchedSearchPostcode: '' }));
  }

  const withDistances = await Promise.all(
    cleaners.map(async (cleaner) => {
      const match = await findBestCleanerDistanceMiles(postcode, cleaner);
      return {
        ...cleaner,
        searchDistanceMiles: Number.isFinite(match.distanceMiles) ? Number(match.distanceMiles.toFixed(1)) : null,
        matchedSearchPostcode: match.matchedPostcode || '',
      };
    })
  );

  const withinRadius = withDistances.filter(
    (cleaner) => typeof cleaner.searchDistanceMiles === 'number' && cleaner.searchDistanceMiles <= radiusMiles
  );

  if (withinRadius.length) {
    return withinRadius.sort((a, b) => {
      if ((a.searchDistanceMiles ?? Infinity) !== (b.searchDistanceMiles ?? Infinity)) {
        return (a.searchDistanceMiles ?? Infinity) - (b.searchDistanceMiles ?? Infinity);
      }
      if (Number(b.isPremium) !== Number(a.isPremium)) return Number(b.isPremium) - Number(a.isPremium);
      return String(a.companyName || a.realName || '').localeCompare(String(b.companyName || b.realName || ''));
    });
  }

  const outwardRegex = buildOutwardRegex(postcode);
  if (!outwardRegex) return withDistances;

  return withDistances.filter((cleaner) => {
    const base = cleaner?.postcode || cleaner?.address?.postcode || '';
    const additional = Array.isArray(cleaner?.additionalPostcodes) ? cleaner.additionalPostcodes : [];
    return outwardRegex.test(base) || additional.some((pc) => outwardRegex.test(pc));
  });
}

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const postcode = searchParams.get('postcode')?.trim() || '';
  const radiusMiles = parseRadiusMiles(searchParams.get('radius'), DEFAULT_SEARCH_RADIUS_MILES);
  const minRating = parseFloat(searchParams.get('minRating')) || 0;
  const bookingStatus = searchParams.get('bookingStatus') || 'all';
  const serviceType = searchParams.get('serviceType')?.trim() || searchParams.get('service')?.trim() || '';

  try {
    if (id) {
      const cleaner = await Cleaner.findById(id).select('-password');

      if (!cleaner) {
        return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
      }

      return NextResponse.json(
        {
          success: true,
          cleaner: {
            _id: cleaner._id,
            realName: cleaner.realName,
            companyName: cleaner.companyName,
            postcode: cleaner.address?.postcode || cleaner.postcode,
            image: resolveCleanerImage(cleaner),
            rates: cleaner.rates,
            isPremium: !!cleaner.isPremium,
            rating: cleaner.rating || null,
            ratingCount: cleaner.ratingCount || 0,
            availability: cleaner.availability || {},
            googleReviewUrl: cleaner.googleReviewUrl || null,
            facebookReviewUrl: cleaner.facebookReviewUrl || null,
            googleReviewRating: cleaner.googleReviewRating || null,
            googleReviewCount: cleaner.googleReviewCount || 0,
            businessInsurance: !!cleaner.businessInsurance,
            insurance: !!cleaner.businessInsurance,
            dbsChecked: !!cleaner.dbsChecked,
          },
        },
        { status: 200 }
      );
    }

    const query = {};
    if (minRating > 0) query.googleReviewRating = { $gte: minRating };

    const serviceQuery = buildServiceQuery(serviceType);
    if (serviceQuery) Object.assign(query, serviceQuery);

    const rawCleaners = await Cleaner.find(query).select('-password').sort({ isPremium: -1, createdAt: -1 });

    const cleaners = rawCleaners
      .map((obj) => {
        try {
          const c = typeof obj.toObject === 'function' ? obj.toObject() : JSON.parse(JSON.stringify(obj));
          return {
            _id: c._id,
            realName: c.realName,
            companyName: c.companyName,
            postcode: c.address?.postcode || c.postcode,
            address: c.address || {},
            additionalPostcodes: Array.isArray(c.additionalPostcodes) ? c.additionalPostcodes : [],
            image: resolveCleanerImage(c),
            rates: c.rates,
            isPremium: !!c.isPremium,
            rating: c.rating || null,
            ratingCount: c.ratingCount || 0,
            availability: c.availability || {},
            googleReviewUrl: c.googleReviewUrl || null,
            facebookReviewUrl: c.facebookReviewUrl || null,
            googleReviewRating: c.googleReviewRating || null,
            googleReviewCount: c.googleReviewCount || 0,
            bookingStatus: determineBookingStatus(c.availability || {}),
            businessInsurance: !!c.businessInsurance,
            insurance: !!c.businessInsurance,
            dbsChecked: !!c.dbsChecked,
            services: Array.isArray(c.services) ? c.services : [],
            servicesDetailed: Array.isArray(c.servicesDetailed) ? c.servicesDetailed : [],
          };
        } catch (err) {
          console.error('Failed to format cleaner object:', err);
          return null;
        }
      })
      .filter(Boolean);

    const distanceRadius = postcode ? radiusMiles : EXPANDED_SEARCH_RADIUS_MILES;
    const locationFiltered = await applyDistanceFiltering(cleaners, postcode, distanceRadius);
    const finalFiltered = bookingStatus === 'all'
      ? locationFiltered
      : locationFiltered.filter((c) => c.bookingStatus === bookingStatus);

    return NextResponse.json(
      {
        success: true,
        cleaners: finalFiltered,
        searchMeta: {
          postcode,
          radiusMiles,
          usedDistanceSearch: Boolean(postcode),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('GET cleaner error:', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch cleaner(s).' }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  const data = await req.json();

  try {
    const existing = await Cleaner.findOne({ email: data.email });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Email already in use.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const cleaner = await Cleaner.create({
      realName: data.realName,
      companyName: data.companyName,
      houseNameNumber: data.houseNameNumber,
      street: data.street,
      county: data.county,
      postcode: data.postcode,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      rates: data.rates,
      availability: data.availability,
      services: data.services,
      businessInsurance: data.businessInsurance,
      googleReviewRating: data.googleReviewRating || null,
      googleReviewCount: data.googleReviewCount || 0,
      googleReviewUrl: data.googleReviewUrl || '',
    });

    return NextResponse.json({ success: true, id: cleaner._id }, { status: 201 });
  } catch (err) {
    console.error('Error creating cleaner:', err);
    return NextResponse.json({ success: false, message: 'Failed to create cleaner.' }, { status: 500 });
  }
}
