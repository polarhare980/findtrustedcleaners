import { NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Purchase from '@/models/Purchase';
import Review from '@/models/Review';

export const runtime = 'nodejs';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function formatSlotLabel(p) {
  const dateText = p?.isoDate || p?.day || 'Booking';
  const hour = p?.hour ? `${String(p.hour).padStart(2, '0')}:00` : '';
  const service = p?.serviceName || 'Cleaning service';
  return [service, dateText, hour].filter(Boolean).join(' • ');
}

export async function GET(req) {
  const { valid, user, response } = await protectApiRoute(req, 'client');
  if (!valid) return response;

  const { searchParams } = new URL(req.url);
  const cleanerId = searchParams.get('cleanerId');
  if (!cleanerId) return json({ success: false, message: 'Missing cleanerId' }, 400);

  if (process.env.USE_DEMO_DATA === 'true') {
    return json({
      success: true,
      data: [{ _id: 'p_demo_accepted', day: 'Monday', hour: '10', status: 'accepted', label: 'Cleaning service • Monday • 10:00' }],
    });
  }

  await dbConnect();
  const purch = await Purchase.find({
    clientId: user._id,
    cleanerId,
    status: { $in: ['accepted', 'approved', 'booked', 'confirmed'] },
  })
    .sort({ appointmentAt: -1, createdAt: -1 })
    .lean();

  const ids = purch.map((p) => p._id);
  const existing = await Review.find({ purchaseId: { $in: ids } }, '_id purchaseId').lean();
  const reviewed = new Set(existing.map((r) => String(r.purchaseId)));

  const eligible = purch
    .filter((p) => !reviewed.has(String(p._id)))
    .map((p) => ({
      ...p,
      label: formatSlotLabel(p),
    }));

  return json({ success: true, data: eligible });
}
