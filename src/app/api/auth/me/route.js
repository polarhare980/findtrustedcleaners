import { protectRoute } from '@/lib/auth';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(req) {
  await connectToDatabase();

  // 🧠 Debug: Check for cookies
  const rawCookies = req.headers.get('cookie') || '';
  console.log('🍪 Cookies received:', rawCookies);

  const { valid, user, response } = await protectRoute(req);
  if (!valid) return response;

  try {
    const userId = user._id;
    const userType = user.type;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, message: 'Invalid user ID' }, { status: 400 });
    }

    let foundUser;

    if (userType === 'cleaner') {
      foundUser = await Cleaner.findById(userId).select('-password');
    } else if (userType === 'client') {
      foundUser = await Client.findById(userId).select('-password');
    } else {
      return NextResponse.json({ success: false, message: 'Invalid user type' }, { status: 403 });
    }

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
