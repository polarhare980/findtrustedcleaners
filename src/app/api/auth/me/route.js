import { protectRoute } from '@/lib/auth';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectRoute(req);
  if (!valid) return response;

  try {
    let foundUser;

    if (user.type === 'cleaner') {
      foundUser = await Cleaner.findById(new mongoose.Types.ObjectId(user._id)).select('-password');
    } else if (user.type === 'client') {
      foundUser = await Client.findById(new mongoose.Types.ObjectId(user._id)).select('-password');
    } else {
      return NextResponse.json({ success: false, message: 'Invalid user type.' }, { status: 403 });
    }

    if (!foundUser) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    // ✅ Safely get plain object
    const userObject = foundUser?.toObject?.() || foundUser || {};

    return NextResponse.json({
      success: true,
      user: { ...userObject, type: user.type },
    });
  } catch (err) {
    console.error('❌ Error fetching user:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
