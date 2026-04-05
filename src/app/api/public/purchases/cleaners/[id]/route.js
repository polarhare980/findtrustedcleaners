import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req, context) {
  const params = await context?.params;
  const cleanerId = params?.id;
  if (!cleanerId) return json({ success: false, purchases: [], message: 'Missing cleaner id' }, 400);
  if (!mongoose.Types.ObjectId.isValid(String(cleanerId))) {
    return json({ success: false, purchases: [], message: 'Invalid cleaner id' }, 400);
  }

  await connectToDatabase();

  const url = new URL(req.url);
  const statusesParam = url.searchParams.get('statuses');
  const dayFilter = url.searchParams.get('day');
  const isoDate = url.searchParams.get('isoDate');
  const since = url.searchParams.get('since');
  const limitParam = parseInt(url.searchParams.get('limit') || '200', 10);
  const limit = Math.min(Math.max(limitParam, 1), 500);

  const defaultStatuses = ['pending_approval', 'pending', 'accepted', 'approved', 'confirmed', 'booked'];
  const statuses = (statusesParam || '').split(',').map((s) => s.trim()).filter(Boolean);
  const effectiveStatuses = statuses.length ? statuses : defaultStatuses;

  const q = { cleanerId, status: { $in: effectiveStatuses } };
  if (dayFilter) q.day = dayFilter;
  if (isoDate) q.isoDate = isoDate;
  if (since) {
    const d = new Date(since);
    if (!isNaN(d.getTime())) q.createdAt = { $gte: d };
  }

  try {
    const rows = await Purchase.find(q)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('day hour span status serviceKey serviceName durationMins bufferBeforeMins bufferAfterMins isoDate createdAt updatedAt')
      .lean();

    const purchases = (rows || []).map((p) => ({
      _id: String(p._id),
      day: p.day,
      hour: Number(p.hour),
      span: Number(p.span || 1),
      status: p.status,
      isoDate: typeof p.isoDate === 'string' ? p.isoDate : '',
      serviceKey: p.serviceKey,
      serviceName: p.serviceName || '',
      durationMins: typeof p.durationMins === 'number' ? p.durationMins : null,
      bufferBeforeMins: p.bufferBeforeMins || 0,
      bufferAfterMins: p.bufferAfterMins || 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    const res = json({ success: true, purchases });
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('Vary', 'Accept-Encoding');
    return res;
  } catch (err) {
    console.error('GET /api/public/purchases/cleaners/:id error', err);
    return json({ success: false, purchases: [], message: 'Server error' }, 500);
  }
}
