import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';
import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/auth';

export async function POST(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectRoute(req);
  if (!valid) return response;
  if (user.type !== 'client') {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const { cleanerId } = await req.json();

    // ✅ Check if purchase already exists
    const existing = await Purchase.findOne({ clientId: user._id, cleanerId });
    if (existing) {
      const cleaner = await Cleaner.findById(cleanerId);
      return NextResponse.json({
        success: true,
        message: 'Purchase already exists',
        cleanerName: cleaner.companyName || cleaner.realName,
        phone: cleaner.phone,
        email: cleaner.email,
      }, { status: 200 });
    }

    // ✅ Create new purchase
    const newPurchase = await Purchase.create({
      clientId: user._id,
      cleanerId,
      date: new Date(),
    });

    // ✅ Fetch cleaner contact details
    const cleaner = await Cleaner.findById(cleanerId);

    return NextResponse.json({
      success: true,
      purchase: newPurchase,
      cleanerName: cleaner.companyName || cleaner.realName,
      phone: cleaner.phone,
      email: cleaner.email,
    });
  } catch (err) {
    console.error('❌ Error creating purchase:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
