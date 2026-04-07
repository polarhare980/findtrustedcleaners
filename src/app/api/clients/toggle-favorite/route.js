import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { protectApiRoute } from "@/lib/auth";
import Client from "@/models/Client";
import mongoose from "mongoose";

export async function POST(req) {
  await connectToDatabase();
  const { valid, user, response } = await protectApiRoute(req, 'client');
  if (!valid) return response;

  const { cleanerId } = await req.json().catch(() => ({}));
  if (!mongoose.Types.ObjectId.isValid(String(cleanerId || ''))) {
    return NextResponse.json({ success: false, message: 'Invalid cleanerId' }, { status: 400 });
  }

  const client = await Client.findById(user._id);
  if (!client) return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 });

  const ids = client.toggleFavourite(cleanerId);
  await client.save();
  const added = ids.includes(String(cleanerId));
  return NextResponse.json({ success: true, added, favourites: ids, favorites: ids });
}
