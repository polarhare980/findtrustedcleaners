const POSTCODE_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
const postcodeCache = globalThis.__ftcPostcodeCache || new Map();
if (!globalThis.__ftcPostcodeCache) globalThis.__ftcPostcodeCache = postcodeCache;

export const DEFAULT_SEARCH_RADIUS_MILES = 8;
export const EXPANDED_SEARCH_RADIUS_MILES = 12;

export function normalizePostcode(value = '') {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

export function getOutwardPostcode(value = '') {
  const normal = normalizePostcode(value);
  if (!normal) return '';
  return normal.split(' ')[0] || normal;
}

export function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildOutwardRegex(postcode = '') {
  const outward = getOutwardPostcode(postcode);
  if (!outward) return null;
  return new RegExp(`^${escapeRegex(outward)}(?:\\b|\\s|$)`, 'i');
}

function getCachedCoordinates(postcode) {
  const key = normalizePostcode(postcode);
  if (!key || !postcodeCache.has(key)) return null;
  const hit = postcodeCache.get(key);
  if (!hit?.expiresAt || hit.expiresAt < Date.now()) {
    postcodeCache.delete(key);
    return null;
  }
  return hit.value;
}

function setCachedCoordinates(postcode, value) {
  const key = normalizePostcode(postcode);
  if (!key) return value;
  postcodeCache.set(key, { value, expiresAt: Date.now() + POSTCODE_CACHE_TTL_MS });
  return value;
}

async function fetchJsonWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function geocodeUkPostcode(postcode = '') {
  const normal = normalizePostcode(postcode);
  if (!normal) return null;

  const cached = getCachedCoordinates(normal);
  if (cached !== null) return cached;

  const data = await fetchJsonWithTimeout(`https://api.postcodes.io/postcodes/${encodeURIComponent(normal)}`);
  const result = data?.result;

  if (!result || typeof result.latitude !== 'number' || typeof result.longitude !== 'number') {
    return setCachedCoordinates(normal, null);
  }

  return setCachedCoordinates(normal, {
    postcode: normal,
    latitude: result.latitude,
    longitude: result.longitude,
    adminDistrict: result.admin_district || '',
    region: result.region || '',
    country: result.country || '',
    quality: result.quality || null,
  });
}

export function haversineMiles(a, b) {
  if (!a || !b) return Infinity;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusMiles = 3958.7613;

  const dLat = toRad((b.latitude || 0) - (a.latitude || 0));
  const dLon = toRad((b.longitude || 0) - (a.longitude || 0));
  const lat1 = toRad(a.latitude || 0);
  const lat2 = toRad(b.latitude || 0);

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const x = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(x));
}

export async function findBestCleanerDistanceMiles(originPostcode = '', cleaner = {}) {
  const origin = await geocodeUkPostcode(originPostcode);
  if (!origin) return { origin: null, distanceMiles: Infinity, matchedPostcode: '', method: 'unavailable' };

  const candidatePostcodes = [
    cleaner?.address?.postcode,
    cleaner?.postcode,
    ...(Array.isArray(cleaner?.additionalPostcodes) ? cleaner.additionalPostcodes : []),
  ]
    .map((value) => normalizePostcode(value))
    .filter(Boolean);

  const uniqueCandidates = [...new Set(candidatePostcodes)];
  if (!uniqueCandidates.length) {
    return { origin, distanceMiles: Infinity, matchedPostcode: '', method: 'missing-cleaner-postcode' };
  }

  const coordinates = await Promise.all(uniqueCandidates.map((pc) => geocodeUkPostcode(pc)));

  let best = { origin, distanceMiles: Infinity, matchedPostcode: '', method: 'distance' };
  coordinates.forEach((coord, index) => {
    if (!coord) return;
    const distanceMiles = haversineMiles(origin, coord);
    if (distanceMiles < best.distanceMiles) {
      best = {
        origin,
        distanceMiles,
        matchedPostcode: uniqueCandidates[index],
        method: 'distance',
      };
    }
  });

  return best;
}

export function parseRadiusMiles(value, fallback = DEFAULT_SEARCH_RADIUS_MILES) {
  const radius = Number(value);
  if (!Number.isFinite(radius) || radius <= 0) return fallback;
  return Math.min(Math.max(radius, 1), 50);
}
