// File: /pages/api/clients/rate-service.js

import dbConnect from '@/lib/dbConnect';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';
import { verifyToken } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    const token = req.cookies.token;
    const user = await verifyToken(token);
    if (!user || user.type !== 'client') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { purchaseId, rating, review } = req.body;

    if (!purchaseId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }

    const purchase = await Purchase.findOne({ _id: purchaseId, clientId: user._id });
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    if (purchase.rating) {
      return res.status(400).json({ success: false, message: 'Already rated' });
    }

    purchase.rating = rating;
    if (review) purchase.review = review;
    await purchase.save();

    // Update cleaner's average rating and review count
    const cleanerId = purchase.cleanerId;
    const allRatings = await Purchase.find({ cleanerId, rating: { $exists: true } }, 'rating');

    const avgRating =
      allRatings.reduce((sum, p) => sum + p.rating, 0) / allRatings.length;

    await Cleaner.findByIdAndUpdate(cleanerId, {
      rating: avgRating.toFixed(2),
      reviewCount: allRatings.length,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('/api/clients/rate-service error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

