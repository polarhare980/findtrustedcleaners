import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/booking';
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

    const now = new Date();
    const bookings = await Booking.find({
      clientId: user._id,
      scheduledDateTime: { $gte: now },
    })
      .populate('cleanerId', 'realName companyName services')
      .sort({ scheduledDateTime: 1 })
      .lean();

    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    console.error('/api/clients/upcoming-bookings error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
