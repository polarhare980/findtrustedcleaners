import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';
import { protectApiRoute } from '@/lib/auth';

export default async function handler(req, res) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  try {
    let filter = {};
    if (user.type === 'client') {
      filter = { clientId: user._id };
    } else if (user.type === 'cleaner') {
      filter = { cleanerId: user._id };
    } else {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const purchases = await Purchase.find(filter)
      .sort({ createdAt: -1 })
      .populate('cleanerId', 'companyName realName phone email')
      .lean();

    res.status(200).json({ success: true, purchases });
  } catch (err) {
    console.error('❌ Failed to fetch purchases:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
