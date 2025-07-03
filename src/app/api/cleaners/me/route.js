import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/auth';

export async function GET(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectRoute(req);
  if (!valid) return response;

  if (user.type !== 'cleaner') {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const cleaner = await Cleaner.findById(user._id).select('-password');

    if (!cleaner) {
      return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, cleaner: cleaner.toObject() });
  } catch (err) {
    console.error('❌ Error fetching cleaner:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
