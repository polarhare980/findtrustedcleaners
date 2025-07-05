import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';
import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/auth';

export async function POST(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectRoute(req);
  if (!valid) return response;

  try {
    const { cleanerId } = await req.json();

    // ✅ Check if purchase already exists
    const existing = await Purchase.findOne({ clientId: user._id, cleanerId });
    if (existing) {
      // Fetch cleaner contact details
      const cleaner = await Cleaner.findById(cleanerId);
      return NextResponse.json({
        success: true,
        cleanerName: cleaner.companyName || cleaner.realName,
        phone: cleaner.phone,
        email: cleaner.email,
      });
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
