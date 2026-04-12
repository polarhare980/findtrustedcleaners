import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Purchase from '@/models/Purchase';
import Review from '@/models/Review';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import { getReviewEligibility } from '@/lib/reviewAccess';

export const runtime = 'nodejs';

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
  return Array.from(
    new Set(
      input
        .map((v) => String(v || '').trim())
        .filter((v) => valid.has(v))
    )
  );
}

function formatEligibilityMessage(reason) {
  switch (reason) {
    case 'too_early':
      return 'Reviews open shortly after the appointment time.';
    case 'review_window_closed':
      return 'This review link has expired.';
    case 'already_reviewed':
      return 'A review has already been submitted for this booking.';
    case 'booking_not_completed_enough':
      return 'This booking is not ready for review yet.';
    case 'missing_appointment_time':
      return 'We could not verify the appointment time for this booking.';
    default:
      return 'This review link is not valid.';
  }
}

async function loadPurchaseByTokenOrId(tokenOrId) {
  let purchase = await Purchase.findOne({ reviewToken: tokenOrId }).lean();

  if (!purchase && mongoose.Types.ObjectId.isValid(tokenOrId)) {
    purchase = await Purchase.findById(tokenOrId).lean();
  }

  if (!purchase) return null;

  const [cleaner, client, existingReview] = await Promise.all([
    Cleaner.findById(purchase.cleanerId, 'companyName realName').lean(),
    purchase.clientId
      ? Client.findById(purchase.clientId, 'fullName name email').lean()
      : null,
    Review.findOne({ purchaseId: purchase._id }, '_id').lean(),
  ]);

  return { purchase, cleaner, client, existingReview };
}

export async function GET(_req, { params }) {
  const token = String(params?.token || '').trim();
  if (!token) {
    return json({ success: false, message: 'Missing review token.' }, 400);
  }

  await dbConnect();

  const loaded = await loadPurchaseByTokenOrId(token);
  if (!loaded) {
    return json({ success: false, message: 'Review link not found.' }, 404);
  }

  const { purchase, cleaner, client, existingReview } = loaded;

  if (existingReview || purchase.reviewSubmittedAt) {
    return json({
      success: true,
      alreadyReviewed: true,
      eligibility: {
        allowed: false,
        reason: 'already_reviewed',
        message: formatEligibilityMessage('already_reviewed'),
      },
      booking: {
        serviceName: purchase.serviceName || '',
        isoDate: purchase.isoDate || '',
        day: purchase.day || '',
        hour: purchase.hour || '',
        cleanerName: cleaner?.companyName || cleaner?.realName || 'Cleaner',
      },
    });
  }

  const eligibility = getReviewEligibility(purchase);

  return json({
    success: true,
    alreadyReviewed: false,
    eligibility: {
      ...eligibility,
      message: formatEligibilityMessage(eligibility.reason),
    },
    booking: {
      purchaseId: String(purchase._id),
      serviceName: purchase.serviceName || '',
      isoDate: purchase.isoDate || '',
      day: purchase.day || '',
      hour: purchase.hour || '',
      cleanerName: cleaner?.companyName || cleaner?.realName || 'Cleaner',
      customerName: client?.fullName || client?.name || purchase.guestName || '',
      customerEmail: client?.email || purchase.guestEmail || '',
    },
  });
}

export async function POST(req, { params }) {
  const token = String(params?.token || '').trim();
  if (!token) {
    return json({ success: false, message: 'Missing review token.' }, 400);
  }

  const body = await req.json().catch(() => ({}));
  const numericRating = Number(body?.rating);
  const text = String(body?.text ?? body?.review ?? '').trim();
  const highlights = normaliseHighlights(body?.highlights);
  const wouldBookAgain = body?.wouldBookAgain !== false;

  if (!numericRating || numericRating < 1 || numericRating > 5) {
    return json(
      { success: false, message: 'Please choose a rating between 1 and 5.' },
      400
    );
  }

  await dbConnect();

  const loaded = await loadPurchaseByTokenOrId(token);
  if (!loaded) {
    return json({ success: false, message: 'Review link not found.' }, 404);
  }

  const { purchase, existingReview } = loaded;

  if (existingReview || purchase.reviewSubmittedAt) {
    return json(
      { success: false, message: formatEligibilityMessage('already_reviewed') },
      409
    );
  }

  const eligibility = getReviewEligibility(purchase);
  if (!eligibility.allowed) {
    return json(
      { success: false, message: formatEligibilityMessage(eligibility.reason) },
      400
    );
  }

  const review = await Review.create({
    cleanerId: purchase.cleanerId,
    clientId: purchase.clientId || null,
    purchaseId: purchase._id,
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

  await Cleaner.findByIdAndUpdate(purchase.cleanerId, {
    rating: summary.avg || 0,
    ratingCount: summary.count || 0,
  });

  await Purchase.updateOne(
    { _id: purchase._id },
    { $set: { reviewSubmittedAt: new Date() } }
  );

  return json({ success: true, message: 'Thanks for your review.' }, 201);
}