import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import { buildServiceMarket } from '@/lib/serviceMarketplace';
import {
  DEFAULT_SEARCH_RADIUS_MILES,
  findBestCleanerDistanceMiles,
  getOutwardPostcode,
  normalizePostcode,
  parseRadiusMiles,
} from '@/lib/postcodeSearch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extractAreaFromRequest(request) {
  const params = new URL(request.url).searchParams;
  const manualPostcode = normalizePostcode(params.get('postcode') || '');
  if (manualPostcode) {
    return {
      postcode: manualPostcode,
      outward: getOutwardPostcode(manualPostcode),
      source: 'manual',
      country: request.headers.get('x-vercel-ip-country') || '',
      city: request.headers.get('x-vercel-ip-city') || '',
      region: request.headers.get('x-vercel-ip-country-region') || '',
    };
  }

  const headerPostcode = normalizePostcode(request.headers.get('x-vercel-ip-postal-code') || '');
  return {
    postcode: headerPostcode,
    outward: getOutwardPostcode(headerPostcode),
    source: headerPostcode ? 'ip' : 'none',
    country: request.headers.get('x-vercel-ip-country') || '',
    city: request.headers.get('x-vercel-ip-city') || '',
    region: request.headers.get('x-vercel-ip-country-region') || '',
  };
}

function summarizeArea(area) {
  if (area.outward) return area.outward;
  if (area.city) return area.city;
  if (area.region) return area.region;
  if (area.country) return area.country;
  return 'the UK';
}

export async function GET(request) {
  try {
    await connectToDatabase();

    const params = new URL(request.url).searchParams;
    const requestedService = String(params.get('service') || '').trim();
    const radiusMiles = parseRadiusMiles(params.get('radius'), DEFAULT_SEARCH_RADIUS_MILES);
    const area = extractAreaFromRequest(request);

    const projection = ['realName', 'companyName', 'services', 'servicesDetailed', 'address', 'additionalPostcodes'].join(' ');

    const serviceQuery = requestedService
      ? {
          $or: [
            { services: { $in: [requestedService] } },
            { servicesDetailed: { $elemMatch: { name: requestedService, active: { $ne: false } } } },
          ],
        }
      : {};

    const cleaners = await Cleaner.find(serviceQuery).select(projection).lean();

    let scopedCleaners = cleaners;
    let scope = 'national';

    if (area.postcode) {
      const withDistances = await Promise.all(
        cleaners.map(async (cleaner) => {
          const match = await findBestCleanerDistanceMiles(area.postcode, cleaner);
          return {
            ...cleaner,
            searchDistanceMiles: Number.isFinite(match.distanceMiles) ? Number(match.distanceMiles.toFixed(1)) : null,
          };
        })
      );

      const nearby = withDistances
        .filter((cleaner) => typeof cleaner.searchDistanceMiles === 'number' && cleaner.searchDistanceMiles <= radiusMiles)
        .sort((a, b) => (a.searchDistanceMiles ?? Infinity) - (b.searchDistanceMiles ?? Infinity));

      if (nearby.length) {
        scopedCleaners = nearby;
        scope = 'local';
      }
    }

    const serviceMarket = buildServiceMarket(scopedCleaners, 12);

    return NextResponse.json({
      success: true,
      scope,
      area: {
        postcode: area.postcode || '',
        outward: area.outward || '',
        label: summarizeArea(area),
        source: area.source,
        radiusMiles,
      },
      serviceMarket,
    });
  } catch (error) {
    console.error('service marketplace error', error);
    return NextResponse.json({ success: false, message: 'Failed to load service marketplace.' }, { status: 500 });
  }
}
