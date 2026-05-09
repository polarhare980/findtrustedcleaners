import { geocodeUkPostcode, haversineMiles, normalizePostcode, parseRadiusMiles } from '@/lib/postcodeSearch';

export const DEFAULT_MATCH_RADIUS_MILES = 8;
export const FALLBACK_MATCH_RADIUS_MILES = 18;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SEARCH_DAYS = 14;

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normaliseLatLng(input = {}) {
  const latitude = asNumber(input.lat ?? input.latitude);
  const longitude = asNumber(input.lng ?? input.longitude);
  if (latitude == null || longitude == null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

function toIsoDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isAvailableValue(value) {
  if (value === true || value === 'available') return true;
  if (value && typeof value === 'object') {
    return value.status === 'available' || value.available === true;
  }
  return false;
}

function dayHasAvailability(dayAvailability = {}) {
  return Object.values(dayAvailability || {}).some(isAvailableValue);
}

function getAvailabilityForDate(cleaner = {}, date = new Date()) {
  const dayName = DAY_NAMES[date.getDay()];
  const iso = toIsoDate(date);
  const base = cleaner?.availability?.[dayName] || {};
  const override = cleaner?.availabilityOverrides?.[iso] || {};
  return { ...base, ...override };
}

export function getCleanerAvailabilityLabel(cleaner = {}) {
  const today = new Date();

  for (let i = 0; i < SEARCH_DAYS; i += 1) {
    const date = addDays(today, i);
    if (!dayHasAvailability(getAvailabilityForDate(cleaner, date))) continue;

    if (i === 0) {
      return { availableToday: true, availabilityRank: 0, nextAvailableLabel: 'Available today' };
    }
    if (i === 1) {
      return { availableToday: false, availabilityRank: 1, nextAvailableLabel: 'Next available tomorrow' };
    }
    return {
      availableToday: false,
      availabilityRank: i,
      nextAvailableLabel: `Next available ${DAY_NAMES[date.getDay()]}`,
    };
  }

  return { availableToday: false, availabilityRank: 99, nextAvailableLabel: 'Unavailable today' };
}

function cleanerPostcodes(cleaner = {}) {
  return [
    cleaner?.address?.postcode,
    cleaner?.postcode,
    ...(Array.isArray(cleaner?.additionalPostcodes) ? cleaner.additionalPostcodes : []),
    ...(Array.isArray(cleaner?.serviceAreas) ? cleaner.serviceAreas.map((area) => area?.postcodePrefix || area?.postcode) : []),
  ].map(normalizePostcode).filter(Boolean);
}

function serviceAreaCoordinates(cleaner = {}) {
  if (!Array.isArray(cleaner?.serviceAreas)) return [];
  return cleaner.serviceAreas
    .map((area) => {
      const coord = normaliseLatLng(area || {});
      if (!coord) return null;
      return {
        ...coord,
        town: area.town || '',
        postcodePrefix: area.postcodePrefix || area.postcode || '',
        radiusMiles: parseRadiusMiles(area.radiusMiles, DEFAULT_MATCH_RADIUS_MILES),
      };
    })
    .filter(Boolean);
}

export async function resolveUserLocation({ lat, lng, postcode, town, requestHeaders } = {}) {
  const gps = normaliseLatLng({ lat, lng });
  if (gps) {
    return { ...gps, source: 'gps', locationConfidence: 'exact', label: 'your area' };
  }

  const pc = normalizePostcode(postcode);
  if (pc) {
    const geocoded = await geocodeUkPostcode(pc);
    if (geocoded) {
      return {
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        source: 'postcode',
        locationConfidence: 'postcode',
        label: geocoded.postcode || pc,
      };
    }
    return { source: 'postcode-text', locationConfidence: 'postcode', postcode: pc, label: pc };
  }

  const headers = requestHeaders;
  const headerLat = headers?.get?.('x-vercel-ip-latitude') || headers?.get?.('x-geo-latitude');
  const headerLng = headers?.get?.('x-vercel-ip-longitude') || headers?.get?.('x-geo-longitude');
  const ipCoord = normaliseLatLng({ lat: headerLat, lng: headerLng });
  if (ipCoord) {
    const city = decodeURIComponent(headers?.get?.('x-vercel-ip-city') || '').replace(/\+/g, ' ');
    return { ...ipCoord, source: 'ip', locationConfidence: 'approximate', label: city || 'your area' };
  }

  if (town) {
    return { source: 'town', locationConfidence: 'approximate', town: String(town).trim(), label: String(town).trim() };
  }

  return { source: 'fallback', locationConfidence: 'fallback', label: 'West Sussex' };
}

async function bestDistanceToCleaner(userLocation, cleaner = {}) {
  if (!userLocation?.latitude || !userLocation?.longitude) return null;
  const origin = { latitude: userLocation.latitude, longitude: userLocation.longitude };

  const directAreas = serviceAreaCoordinates(cleaner);
  let best = { distanceMiles: Infinity, matchedArea: '', areaRadiusMiles: DEFAULT_MATCH_RADIUS_MILES, method: 'coordinates' };

  directAreas.forEach((area) => {
    const distanceMiles = haversineMiles(origin, area);
    if (distanceMiles < best.distanceMiles) {
      best = {
        distanceMiles,
        matchedArea: area.town || area.postcodePrefix || '',
        areaRadiusMiles: area.radiusMiles,
        method: 'service-area',
      };
    }
  });

  const postcodes = [...new Set(cleanerPostcodes(cleaner))].slice(0, 8);
  const coords = await Promise.all(postcodes.map((pc) => geocodeUkPostcode(pc)));
  coords.forEach((coord, index) => {
    if (!coord) return;
    const distanceMiles = haversineMiles(origin, coord);
    if (distanceMiles < best.distanceMiles) {
      best = {
        distanceMiles,
        matchedArea: postcodes[index],
        areaRadiusMiles: DEFAULT_MATCH_RADIUS_MILES,
        method: 'postcode',
      };
    }
  });

  if (!Number.isFinite(best.distanceMiles)) return null;
  return best;
}

function textLocationScore(userLocation = {}, cleaner = {}) {
  const search = [userLocation.postcode, userLocation.town, userLocation.label].filter(Boolean).join(' ').toUpperCase();
  if (!search || userLocation.locationConfidence === 'fallback') return 0;
  const values = [
    cleaner?.address?.town,
    cleaner?.address?.county,
    cleaner?.address?.postcode,
    cleaner?.postcode,
    ...(Array.isArray(cleaner?.additionalPostcodes) ? cleaner.additionalPostcodes : []),
    ...(Array.isArray(cleaner?.serviceAreas) ? cleaner.serviceAreas.flatMap((area) => [area?.town, area?.postcodePrefix]) : []),
  ].filter(Boolean).join(' ').toUpperCase();

  if (!values) return 0;
  const outward = normalizePostcode(search).split(' ')[0];
  if (outward && values.includes(outward)) return 35;
  return search.split(/\s+/).some((part) => part.length > 3 && values.includes(part)) ? 20 : 0;
}

export async function matchCleanersToLocation(cleaners = [], userLocation = {}, options = {}) {
  const radiusMiles = parseRadiusMiles(options.radiusMiles, DEFAULT_MATCH_RADIUS_MILES);
  const hasPreciseLocation = Boolean(userLocation?.latitude && userLocation?.longitude);

  const matched = await Promise.all((cleaners || []).map(async (cleaner) => {
    const availability = getCleanerAvailabilityLabel(cleaner);
    const distance = hasPreciseLocation ? await bestDistanceToCleaner(userLocation, cleaner) : null;
    const distanceMiles = distance ? Number(distance.distanceMiles.toFixed(1)) : null;
    const allowedRadius = distance?.areaRadiusMiles || radiusMiles;
    const localTextScore = textLocationScore(userLocation, cleaner);
    const isWithinRadius = distanceMiles == null ? localTextScore > 0 : distanceMiles <= Math.max(allowedRadius, radiusMiles);

    const distanceScore = distanceMiles == null ? localTextScore : Math.max(0, 80 - distanceMiles * 4);
    const availabilityScore = availability.availableToday ? 28 : availability.availabilityRank < 7 ? 12 : 0;
    const premiumScore = cleaner?.isPremium ? 7 : 0;
    const reviewScore = Math.min(Number(cleaner?.googleReviewRating || cleaner?.rating || 0) * 2, 10);

    return {
      ...cleaner,
      ...availability,
      distanceMiles,
      matchedArea: distance?.matchedArea || '',
      locationConfidence: userLocation.locationConfidence || 'fallback',
      localMatch: Boolean(isWithinRadius),
      matchScore: distanceScore + availabilityScore + premiumScore + reviewScore,
    };
  }));

  const local = matched.filter((cleaner) => cleaner.localMatch);
  const pool = local.length ? local : matched;

  return pool.sort((a, b) => {
    if ((b.availableToday ? 1 : 0) !== (a.availableToday ? 1 : 0)) return (b.availableToday ? 1 : 0) - (a.availableToday ? 1 : 0);
    if ((b.matchScore || 0) !== (a.matchScore || 0)) return (b.matchScore || 0) - (a.matchScore || 0);
    if ((a.distanceMiles ?? Infinity) !== (b.distanceMiles ?? Infinity)) return (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity);
    if (Number(b.isPremium) !== Number(a.isPremium)) return Number(b.isPremium) - Number(a.isPremium);
    return String(a.companyName || '').localeCompare(String(b.companyName || ''));
  });
}
