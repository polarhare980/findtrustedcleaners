// File: /pages/api/clients/favorites.js

import dbConnect from '@/lib/dbConnect';
import Client from '@/models/Client';
import Cleaner from '@/models/Cleaner';
import { verifyToken } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    const token = req.cookies.token;
    const user = await verifyToken(token);

    if (!user || user.type !== 'client') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const client = await Client.findById(user._id).lean();
    if (!client || !client.favorites || client.favorites.length === 0) {
      return res.status(200).json({ success: true, favorites: [] });
    }

    const favorites = await Cleaner.find({ _id: { $in: client.favorites } })
      .select('realName companyName services rating reviewCount')
      .lean();

    return res.status(200).json({ success: true, favorites });
  } catch (err) {
    console.error('/api/clients/favorites error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
