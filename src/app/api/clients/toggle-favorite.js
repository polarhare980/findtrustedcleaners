// File: /pages/api/clients/toggle-favorite.js
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Client from '@/models/Client';
import { protectApiRoute } from '@/lib/auth';

export default async function handler(req, res) {
  console.log('💥 toggle-favorite hit:', req.method);

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

    // Auth: must be logged in as a client
    const { valid, user, response } = await protectApiRoute(req, 'client');
    if (!valid) return response;

    const { cleanerId } = req.body || {};
    if (!cleanerId) {
      return res.status(400).json({ success: false, message: 'Missing cleanerId' });
    }

    // Validate ObjectId format to avoid cast errors
    const idStr = String(cleanerId);
    if (!mongoose.Types.ObjectId.isValid(idStr)) {
      return res.status(400).json({ success: false, message: 'Invalid cleanerId' });
    }

    const client = await Client.findById(user._id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Ensure array exists (defensive)
    if (!Array.isArray(client.favorites)) client.favorites = [];

    // --- Toggle (uses model helper if present, otherwise inline fallback) ---
    const before = client.favorites.map(String);

    let after;
    if (typeof client.toggleFavourite === 'function') {
      // model helper should return string[] of IDs
      after = client.toggleFavourite(idStr);
    } else {
      // Inline toggle fallback
      const exists = before.includes(idStr);
      if (exists) {
        client.favorites = client.favorites.filter((oid) => String(oid) !== idStr);
      } else {
        client.favorites.push(new mongoose.Types.ObjectId(idStr));
      }
      after = client.favorites.map(String);
    }

    const added = after.length > before.length;

    await client.save();

    return res.status(200).json({
      success: true,
      favorites: after,   // US spelling
      favourites: after,  // UK alias
      added,
    });
  } catch (err) {
    console.error('/api/clients/toggle-favorite error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
