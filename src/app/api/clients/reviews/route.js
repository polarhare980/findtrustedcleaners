import { NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Review from "@/models/Review";
import Purchase from "@/models/Purchase";
import Cleaner from "@/models/Cleaner";

export const runtime = "nodejs";

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req) {
  const { valid, user, response } = await protectApiRoute(req, "client");
  if (!valid) return response;

  const { cleanerId, purchaseId, rating, text } = await req.json().catch(() => ({}));
  const numericRating = Number(rating);

  if (!cleanerId || !purchaseId || !numericRating) return json({ success: false, message: "Missing fields" }, 400);
  if (numericRating < 1 || numericRating > 5) return json({ success: false, message: "Invalid rating" }, 400);

  await dbConnect();

  const purchase = await Purchase.findById(purchaseId);
  if (!purchase || String(purchase.clientId) !== String(user._id) || String(purchase.cleanerId) !== String(cleanerId)) {
    return json({ success: false, message: "Not allowed" }, 403);
  }

  if (!["accepted", "approved", "booked", "confirmed"].includes(String(purchase.status || '').toLowerCase())) {
    return json({ success: false, message: "You can only review completed/accepted jobs" }, 400);
  }

  const existing = await Review.findOne({ purchaseId });
  if (existing) return json({ success: false, message: "A review has already been submitted for this booking." }, 409);

  const review = await Review.create({
    cleanerId,
    clientId: user._id,
    purchaseId,
    rating: numericRating,
    text: String(text || '').trim(),
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

  return json({ success: true, data: review }, 201);
}
