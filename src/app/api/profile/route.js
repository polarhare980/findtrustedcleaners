import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import Cleaner from '@/models/Cleaner';
import { protectApiRoute } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  const Model = user.type === 'client' ? Client : Cleaner;

  try {
    const fullUser = await Model.findById(user._id).select('-password');

    if (!fullUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: fullUser }, { status: 200 });
  } catch (err) {
    console.error('❌ Error fetching user:', err.message);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
