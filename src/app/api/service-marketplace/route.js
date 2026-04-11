import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import { buildServiceMarket } from '@/lib/serviceMarketplace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizePostcode(value = '') {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, ' ').trim();
}

function getOutwardPostcode(value = '') {
  const normal = normalizePostcode(value);
  if (!normal) return '';
  return normal.split(' ')[0] || normal;
}

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildAreaRegex(postcode = '') {
  const outward = getOutwardPostcode(postcode);
  if (!outward) return null;
  return new RegExp(`^${escapeRegex(outward)}(?:\\b|\\s|$)`, 'i');
}

function extractAreaFromRequest(request) {
  const qp = new URL(request.url).searchParams.get('postcode');
  const manualPostcode = normalizePostcode(qp || '');
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

    const area = extractAreaFromRequest(request);
    const regex = area.country && area.country !== 'GB' ? null : buildAreaRegex(area.postcode);

    const projection = ['realName', 'companyName', 'services', 'servicesDetailed', 'address', 'additionalPostcodes'].join(' ');

    let cleaners = [];
    let scope = 'national';

    if (regex) {
      cleaners = await Cleaner.find({
        $or: [{ 'address.postcode': regex }, { additionalPostcodes: regex }],
      })
        .select(projection)
        .lean();

      if (cleaners.length) scope = 'local';
    }

    if (!cleaners.length) {
      cleaners = await Cleaner.find({}).select(projection).lean();
    }

    const serviceMarket = buildServiceMarket(cleaners, 12);

    return NextResponse.json({
      success: true,
      scope,
      area: {
        postcode: area.postcode || '',
        outward: area.outward || '',
        city: area.city || '',
        region: area.region || '',
        country: area.country || '',
        source: area.source,
        label: summarizeArea(area),
      },
      serviceMarket,
    });
  } catch (error) {
    console.error('GET /api/service-marketplace error:', error);
    return NextResponse.json(
      {
        success: false,
        scope: 'national',
        area: {
          postcode: '',
          outward: '',
          city: '',
          region: '',
          country: '',
          source: 'none',
          label: 'the UK',
        },
        serviceMarket: [],
        message: 'Server error',
      },
      { status: 500 }
    );
  }
}
