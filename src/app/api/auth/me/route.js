export const dynamic = 'force-dynamic';

import { protectApiRoute } from '@/lib/auth';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  try {
    const userId = user.id || user._id;
    const userType = user.type;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, message: 'Invalid user ID' }, { status: 400 });
    }

    const foundUser = userType === 'cleaner'
      ? await Cleaner.findById(userId).select('-password')
      : await Client.findById(userId).select('-password');

    if (!foundUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const userObj = foundUser.toObject?.() || foundUser;

    return NextResponse.json({
      success: true,
      user: {
        ...userObj,
        _id: userObj._id?.toString() || '',
        type: userType,
      },
    });
  } catch (err) {
    console.error('❌ Error in /api/auth/me:', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
