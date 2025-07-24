import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';
import { NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/auth';

export async function GET(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  if (user.type !== 'client') {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const purchases = await Purchase.find({ clientId: user._id }).lean();

    const detailedPurchases = await Promise.all(
      purchases.map(async (purchase) => {
        const cleaner = await Cleaner.findById(purchase.cleanerId);
        return {
          cleanerId: cleaner._id,
          cleanerName: cleaner.realName,
          phone: cleaner.phone,
          email: cleaner.email,
        };
      })
    );

    return NextResponse.json({ success: true, purchases: detailedPurchases });
  } catch (err) {
    console.error('❌ Error fetching purchases:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
