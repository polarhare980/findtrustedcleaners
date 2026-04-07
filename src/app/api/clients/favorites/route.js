import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { protectApiRoute } from "@/lib/auth";
import Client from "@/models/Client";

export async function GET(req) {
  await connectToDatabase();
  const { valid, user, response } = await protectApiRoute(req, 'client');
  if (!valid) return response;

  const client = await Client.findById(user._id)
    .populate('favorites', 'realName companyName image services rating ratingCount googleReviewRating googleReviewCount address')
    .lean();

  const favorites = Array.isArray(client?.favorites) ? client.favorites.map((fav) => ({
    ...fav,
    _id: String(fav._id),
    image: fav?.image || '',
    reviewCount: fav?.ratingCount || fav?.googleReviewCount || 0,
    rating: fav?.rating || fav?.googleReviewRating || null,
  })) : [];

  return NextResponse.json({ success: true, favorites, favouriteIds: favorites.map((f) => String(f._id)) });
}
