import { protectRoute } from '@/lib/auth';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import { NextResponse } from 'next/server';

// 💡 UTILITY FUNCTIONS

async function findUserById(userId, userType) {
  if (userType === 'cleaner') return await Cleaner.findById(userId).lean();
  if (userType === 'client') return await Client.findById(userId).lean();
  return null;
}

function sanitizeUser(user) {
  const { password, __v, ...cleanUser } = user;
  return cleanUser;
}

// 🚀 MAIN API HANDLER

export async function GET(req) {
  console.log('✅ /auth/me route hit');

  // ✅ Validate the token
  const authResult = await protectRoute(req);

  if (authResult.error) {
    console.log('❌ Token error:', authResult.error);
    return new NextResponse(
      JSON.stringify({ success: false, message: authResult.error }),
      { status: 401 }
    );
  }

  const { _id, type } = authResult.user;
  console.log('🔑 Token valid for ID:', _id, 'Type:', type);

  // ✅ Fetch user from DB
  const user = await findUserById(_id, type);

  if (!user) {
    console.log('❌ User not found');
    return new NextResponse(
      JSON.stringify({ success: false, message: 'User not found' }),
      { status: 404 }
    );
  }

  const cleanUser = sanitizeUser(user);

  console.log('✅ User found:', cleanUser.email);

  return new NextResponse(
    JSON.stringify({ success: true, user: { ...cleanUser, type } }),
    { status: 200 }
  );
}
