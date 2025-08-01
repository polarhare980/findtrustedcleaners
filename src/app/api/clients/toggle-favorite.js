// File: /pages/api/clients/toggle-favorite.js

import dbConnect from '@/lib/dbConnect';
import Client from '@/models/Client';
import { verifyToken } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    import { protectApiRoute } from '@/lib/auth';

const { valid, user, response } = await protectApiRoute(req, 'client');
if (!valid) return response;


    const { cleanerId } = req.body;
    if (!cleanerId) {
      return res.status(400).json({ success: false, message: 'Missing cleanerId' });
    }

    const client = await Client.findById(user._id);
    const index = client.favorites.indexOf(cleanerId);
    let added = false;

    if (index === -1) {
      client.favorites.push(cleanerId);
      added = true;
    } else {
      client.favorites.splice(index, 1);
    }

    await client.save();

    const updatedFavorites = await Client.findById(user._id)
      .populate('favorites', 'realName companyName services rating reviewCount')
      .then(c => c.favorites);

    return res.status(200).json({ success: true, favorites: updatedFavorites, added });
  } catch (err) {
    console.error('/api/clients/toggle-favorite error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
