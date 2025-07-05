import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  await connectToDatabase();

  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorised' }, { status: 401 });
    }

    const user = await verifyToken(token);

    if (!user || user.type !== 'client') {
      return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
    }

    const purchases = await Purchase.find({ clientId: user.id }).lean();

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
