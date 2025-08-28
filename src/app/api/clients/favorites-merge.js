// File: /pages/api/clients/favorites-merge.js
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Client from '@/models/Client';
import { protectApiRoute } from '@/lib/auth';

export default async function handler(req, res) {
  // Preflight + method guard
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    // Auth: client only
    const { valid, user, response } = await protectApiRoute(req, 'client');
    if (!valid) return response;

    const body = req.body || {};
    const incoming = Array.isArray(body.favourites || body.favorites)
      ? (body.favourites || body.favorites)
      : [];

    // keep only valid ObjectIds as strings, unique them
    const validIncoming = Array.from(
      new Set(
        incoming
          .map(String)
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
      )
    );

    const client = await Client.findById(user._id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    if (!Array.isArray(client.favorites)) client.favorites = [];

    const existing = client.favorites.map(String);

    // set union of existing + incoming
    const merged = Array.from(new Set([...existing, ...validIncoming]));

    // write back as ObjectIds
    client.favorites = merged.map((id) => new mongoose.Types.ObjectId(id));
    await client.save();

    // respond with merged IDs (string)
    return res.status(200).json({
      success: true,
      favourites: merged,
      favorites: merged, // alias
    });
  } catch (err) {
    console.error('/api/clients/favorites-merge error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
