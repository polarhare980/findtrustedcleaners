import dbConnect from '@/lib/dbConnect';
import Client from '@/models/Client';
import Cleaner from '@/models/Cleaner';
import { protectApiRoute } from '@/lib/auth';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    const { valid, user, response } = await protectApiRoute(req, 'client');
    if (!valid) return response;

    const client = await Client.findById(user._id).select('favorites').lean();
    const favIds = (client?.favorites || []).map(id => new mongoose.Types.ObjectId(id));
    if (favIds.length === 0) {
      return res.status(200).json({ success: true, favorites: [], favouriteIds: [] });
    }

    // Fetch favourites
    const docs = await Cleaner.find({ _id: { $in: favIds } })
      .select('realName companyName image services rates rating reviewCount googleReviewRating googleReviewCount isPremium businessInsurance')
      .lean();

    // Preserve the original order from client.favorites
    const indexMap = new Map(favIds.map((id, i) => [String(id), i]));
    const favorites = docs.sort((a, b) => (indexMap.get(String(a._id)) ?? 0) - (indexMap.get(String(b._id)) ?? 0));

    return res.status(200).json({
      success: true,
      favorites,
      favouriteIds: favIds.map(id => String(id)),
    });
  } catch (err) {
    console.error('/api/clients/favorites error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
