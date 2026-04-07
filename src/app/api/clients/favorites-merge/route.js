import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { protectApiRoute } from "@/lib/auth";
import Client from "@/models/Client";
import mongoose from "mongoose";

export async function POST(req) {
  await connectToDatabase();
  const { valid, user, response } = await protectApiRoute(req, 'client');
  if (!valid) return response;

  const { favourites = [], favorites = [] } = await req.json().catch(() => ({}));
  const incoming = [...favourites, ...favorites]
    .map((v) => String(v))
    .filter((v) => mongoose.Types.ObjectId.isValid(v));

  const client = await Client.findById(user._id);
  if (!client) return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 });

  const merged = Array.from(new Set([...(client.favorites || []).map(String), ...incoming]));
  client.favorites = merged;
  await client.save();

  return NextResponse.json({ success: true, favourites: merged, favorites: merged });
}
