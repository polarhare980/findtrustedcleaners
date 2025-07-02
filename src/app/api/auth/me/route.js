import { protectRoute } from '@/lib/auth';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import { NextResponse } from 'next/server';

export async function GET(req) {
  // ✅ Validate the token
  const authResult = await protectRoute(req);

  if (authResult.error) {
    // ❌ If token is missing or invalid, return 401
    return new NextResponse(
      JSON.stringify({ success: false, message: authResult.error }),
      { status: 401 }
    );
  }

  // ✅ Extract user ID and type from decoded token
  const { id, type } = authResult.user;

  let user;

  // ✅ Fetch the correct user from the database based on type
  if (type === 'cleaner') {
    user = await Cleaner.findById(id);
  } else if (type === 'client') {
    user = await Client.findById(id);
  } else {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Invalid user type' }),
      { status: 400 }
    );
  }

  if (!user) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'User not found' }),
      { status: 404 }
    );
  }

  // ✅ Return user profile data AND type
  return new NextResponse(
    JSON.stringify({ success: true, user: { ...user.toObject(), type } }),
    { status: 200 }
  );
}
