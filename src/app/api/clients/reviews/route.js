import { NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';

export const runtime = 'nodejs';

const ALLOWED_STATUSES = new Set(['accepted', 'approved', 'booked', 'confirmed']);
const ALLOWED_HIGHLIGHTS = [
  'On time',
  'Friendly',
  'Good communication',
  'Quality of cleaning',
  'Would book again',
];

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function normaliseHighlights(input) {
  if (!Array.isArray(input)) return [];
  const valid = new Set(ALLOWED_HIGHLIGHTS);
  return Array.from(new Set(input.map((v) => String(v || '').trim()).filter((v) => valid.has(v))));
}

export async function POST(req) {
  const { valid, user, response } = await protectApiRoute(req, 'client');
  if (!valid) return response;

  const body = await req.json().catch(() => ({}));
  const purchaseId = body?.purchaseId;
  const cleanerIdFromBody = body?.cleanerId;
  const numericRating = Number(body?.rating);
  const text = String(body?.text ?? body?.review ?? '').trim();
  const highlights = normaliseHighlights(body?.highlights);
  const wouldBookAgain = body?.wouldBookAgain !== false;

  if (!purchaseId || !numericRating) {
    return json({ success: false, message: 'Please choose a booking and a star rating.' }, 400);
  }
  if (numericRating < 1 || numericRating > 5) {
    return json({ success: false, message: 'Please choose a rating between 1 and 5.' }, 400);
  }

  await dbConnect();

  const purchase = await Purchase.findById(purchaseId);
  if (!purchase || String(purchase.clientId) !== String(user._id)) {
    return json({ success: false, message: 'This booking is not available to review.' }, 403);
  }

  const cleanerId = String(cleanerIdFromBody || purchase.cleanerId || '');
  if (!cleanerId || String(purchase.cleanerId) !== cleanerId) {
    return json({ success: false, message: 'This review does not match the cleaner on the booking.' }, 403);
  }

  if (!ALLOWED_STATUSES.has(String(purchase.status || '').toLowerCase())) {
    return json({ success: false, message: 'You can only review accepted or completed bookings.' }, 400);
  }

  const existing = await Review.findOne({ purchaseId });
  if (existing) {
    return json({ success: false, message: 'A review has already been submitted for this booking.' }, 409);
  }

  const review = await Review.create({
    cleanerId,
    clientId: user._id,
    purchaseId,
    rating: numericRating,
    text,
    highlights,
    wouldBookAgain,
    serviceName: String(purchase.serviceName || '').trim(),
    appointmentAt: purchase.appointmentAt || null,
    verifiedBooking: true,
  });

  const agg = await Review.aggregate([
    { $match: { cleanerId: review.cleanerId } },
    { $group: { _id: '$cleanerId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const summary = agg[0] || {};
  await Cleaner.findByIdAndUpdate(cleanerId, {
    rating: summary.avg || 0,
    ratingCount: summary.count || 0,
  });

  purchase.reviewSubmittedAt = new Date();
  if (!purchase.completedAt) purchase.completedAt = purchase.appointmentAt || new Date();
  if (!purchase.expiresAt && purchase.completedAt) {
    purchase.expiresAt = new Date(purchase.completedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
  }
  await purchase.save();

  return json({ success: true, message: 'Thanks for your review.', data: review }, 201);
}
