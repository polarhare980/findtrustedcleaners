import dbConnect from '@/lib/dbConnect';
import Client from '@/models/Client';
import Cleaner from '@/models/Cleaner';
import { protectApiRoute } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    const { valid, user, response } = await protectApiRoute(req, 'client');
    if (!valid) return response;

    const client = await Client.findById(user._id).lean();
    if (!client?.favorites?.length) {
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
