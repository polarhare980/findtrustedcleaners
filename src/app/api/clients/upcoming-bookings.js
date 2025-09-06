// File: /pages/api/clients/upcoming-bookings.js
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/booking';
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

    // Optional: lightweight diagnostics (remove once stable)
    console.log('[upcoming-bookings] host=%s cookiePresent=%s authHeader=%s',
      req.headers.host,
      Boolean(cookieToken),
      headerAuth ? 'yes' : 'no'
    );

    const user = token ? await verifyToken(token) : null;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (user.type !== 'client') {
      return res.status(403).json({ success: false, message: 'Forbidden: client only' });
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
