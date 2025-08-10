// File: /pages/api/clients/favorites.js
import dbConnect from '@/lib/dbConnect';
import Client from '@/models/Client';
import Cleaner from '@/models/Cleaner';
import { verifyToken } from '@/lib/auth';

export default async function handler(req, res) {
  // Preflight + method guard
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    // --- Auth: accept cookie or Authorization header ---
    const headerAuth = req.headers.authorization || '';
    const bearer = headerAuth.startsWith('Bearer ') ? headerAuth.slice(7) : '';
    const cookieToken =
      (req.cookies && (req.cookies.token || req.cookies.authToken)) || '';
    const token = bearer || cookieToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (user.type !== 'client') {
      return res.status(403).json({ success: false, message: 'Forbidden: client only' });
    }

    const client = await Client.findById(user._id).select('favorites').lean();
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Keep IDs as strings; Mongoose will cast on query
    const favIds = (client.favorites || []).map(String);

    if (favIds.length === 0) {
      return res.status(200).json({ success: true, favorites: [], favouriteIds: [] });
    }

    // Fetch favourite cleaners (restrict fields)
    const docs = await Cleaner.find({ _id: { $in: favIds } })
      .select(
        '_id realName companyName image services rates rating reviewCount googleReviewRating googleReviewCount isPremium businessInsurance'
      )
      .lean();

    // Preserve client-defined order
    const indexMap = new Map(favIds.map((id, i) => [id, i]));
    const favorites = docs.sort(
      (a, b) => (indexMap.get(String(a._id)) ?? 0) - (indexMap.get(String(b._id)) ?? 0)
    );

    return res.status(200).json({
      success: true,
      favorites,            // cleaner docs in saved order
      favouriteIds: favIds, // string IDs (UK alias kept)
    });
  } catch (err) {
    console.error('/api/clients/favorites error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
