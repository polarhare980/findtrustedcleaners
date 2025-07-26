import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Cleaner from '@/models/Cleaner';
import Booking from '@/models/booking';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid || user.type !== 'cleaner') return response;

  try {
    const cleanerId = user._id || user.id;

    const cleaner = await Cleaner.findById(cleanerId);
    if (!cleaner || !cleaner.isPremium) {
      return NextResponse.json({ success: false, message: 'Premium access required' }, { status: 403 });
    }

    const bookings = await Booking.find({ cleanerId, status: 'accepted' });

    const totalJobs = bookings.length;
    const totalEarnings = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const views = cleaner.views || 0;
    const unlocks = cleaner.profileUnlocks || 0;
    const conversionRate = views > 0 ? (unlocks / views) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalJobs,
        totalEarnings,
        views,
        unlocks,
        conversionRate: Number(conversionRate.toFixed(1)),
      },
    });
  } catch (err) {
    console.error('Earnings fetch error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
