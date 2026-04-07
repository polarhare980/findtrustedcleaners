import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';

export const runtime = 'nodejs';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

const HIGHLIGHT_KEYS = ['On time', 'Friendly', 'Good communication', 'Quality of cleaning', 'Would book again'];

export async function GET(_req, { params }) {
  const id = params?.id;
  if (!id) return json({ success: false, message: 'Missing id' }, 400);

  if (process.env.USE_DEMO_DATA === 'true') {
    return json({
      success: true,
      summary: { average: 5, count: 1, breakdown: { 5: 1, 4: 0, 3: 0, 2: 0, 1: 0 }, highlights: { 'On time': 1, Friendly: 1, 'Good communication': 1, 'Quality of cleaning': 1, 'Would book again': 1 } },
      data: [{ _id: 'rev1', rating: 5, text: 'Brilliant job!', createdAt: new Date().toISOString(), highlights: ['On time', 'Friendly'], wouldBookAgain: true, verifiedBooking: true, serviceName: 'Standard clean' }],
    });
  }

  await dbConnect();
  const rows = await Review.find({ cleanerId: id })
    .select('rating text createdAt highlights wouldBookAgain verifiedBooking serviceName appointmentAt')
    .sort({ createdAt: -1 })
    .lean();

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const highlightCounts = Object.fromEntries(HIGHLIGHT_KEYS.map((key) => [key, 0]));

  let total = 0;
  let sum = 0;

  for (const row of rows) {
    const rating = Number(row?.rating || 0);
    if (rating >= 1 && rating <= 5) {
      breakdown[rating] += 1;
      sum += rating;
      total += 1;
    }
    for (const tag of Array.isArray(row?.highlights) ? row.highlights : []) {
      if (Object.prototype.hasOwnProperty.call(highlightCounts, tag)) {
        highlightCounts[tag] += 1;
      }
    }
    if (row?.wouldBookAgain) highlightCounts['Would book again'] += 0;
  }

  return json({
    success: true,
    summary: {
      average: total ? sum / total : 0,
      count: total,
      breakdown,
      highlights: highlightCounts,
    },
    data: (rows || []).map((row) => ({
      _id: String(row._id),
      rating: row.rating,
      text: row.text || '',
      createdAt: row.createdAt,
      highlights: Array.isArray(row.highlights) ? row.highlights : [],
      wouldBookAgain: row.wouldBookAgain !== false,
      verifiedBooking: row.verifiedBooking !== false,
      serviceName: row.serviceName || '',
      appointmentAt: row.appointmentAt || null,
    })),
  });
}
