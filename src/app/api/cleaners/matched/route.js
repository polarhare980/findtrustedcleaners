import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cleaner from '@/models/Cleaner';
import { matchCleanersToLocation, resolveUserLocation } from '@/lib/locationMatch';
import { parseRadiusMiles } from '@/lib/postcodeSearch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

const DOMESTIC_SERVICES = [
  'Regular Cleaning',
  'One-Off Deep Clean',
  'Spring Cleaning',
  'After-party Cleaning',
  'End of Tenancy',
  'Moving House Cleaning',
];

function buildServiceQuery(serviceType = '', category = '') {
  const requestedServices = category === 'domestic'
    ? DOMESTIC_SERVICES
    : serviceType
      ? [serviceType]
      : [];

  if (!requestedServices.length) return null;

  return {
    $or: [
      { services: { $in: requestedServices } },
      { servicesDetailed: { $elemMatch: { name: { $in: requestedServices }, active: { $ne: false } } } },
    ],
  };
}

function publicCleaner(c = {}) {
  return {
    _id: c?._id ? String(c._id) : undefined,
    realName: c.realName,
    companyName: c.companyName,
    postcode: c.address?.postcode || c.postcode || '',
    address: c.address || {},
    additionalPostcodes: Array.isArray(c.additionalPostcodes) ? c.additionalPostcodes : [],
    serviceAreas: Array.isArray(c.serviceAreas) ? c.serviceAreas : [],
    image: resolveCleanerImage(c),
    rates: c.rates,
    isPremium: !!c.isPremium,
    rating: c.rating || null,
    ratingCount: c.ratingCount || 0,
    availability: c.availability || {},
    availabilityOverrides: c.availabilityOverrides || {},
    googleReviewUrl: c.googleReviewUrl || null,
    googleReviewRating: c.googleReviewRating || null,
    googleReviewCount: c.googleReviewCount || 0,
    businessInsurance: !!c.businessInsurance,
    insurance: !!c.businessInsurance,
    dbsChecked: !!c.dbsChecked,
    services: Array.isArray(c.services) ? c.services : [],
    servicesDetailed: Array.isArray(c.servicesDetailed) ? c.servicesDetailed : [],
  };
}

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const postcode = searchParams.get('postcode')?.trim() || '';
    const town = searchParams.get('town')?.trim() || '';
    const serviceType = searchParams.get('serviceType')?.trim() || searchParams.get('service')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const radiusMiles = parseRadiusMiles(searchParams.get('radius'), 8);

    const query = {};
    const serviceQuery = buildServiceQuery(serviceType, category);
    if (serviceQuery) Object.assign(query, serviceQuery);

    const raw = await Cleaner.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ isPremium: -1, createdAt: -1 })
      .lean();

    const userLocation = await resolveUserLocation({ lat, lng, postcode, town, requestHeaders: req.headers });
    const cleaners = raw.map(publicCleaner);
    const matched = await matchCleanersToLocation(cleaners, userLocation, { radiusMiles });

    return NextResponse.json({
      success: true,
      cleaners: matched,
      location: {
        label: userLocation.label || '',
        source: userLocation.source || 'fallback',
        locationConfidence: userLocation.locationConfidence || 'fallback',
      },
      searchMeta: {
        postcode,
        town,
        radiusMiles,
        category,
        usedDistanceSearch: Boolean(lat && lng) || Boolean(postcode),
        fallbackUsed: !matched.some((cleaner) => cleaner.localMatch),
      },
    });
  } catch (err) {
    console.error('GET /api/cleaners/matched error:', err);
    return NextResponse.json({ success: false, cleaners: [], message: 'Failed to match cleaners.' }, { status: 500 });
  }
}
