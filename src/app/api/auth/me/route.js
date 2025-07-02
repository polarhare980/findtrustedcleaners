import { protectRoute } from '@/lib/auth';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import { NextResponse } from 'next/server';

export async function GET(req) {
  // ✅ Validate the token
  const authResult = await protectRoute(req);

  if (authResult.error) {
    return new NextResponse(
      JSON.stringify({ success: false, message: authResult.error }),
      { status: 401 }
    );
  }

  // ✅ Correct token extraction
  const { _id, type } = authResult.user;

  let user;

  if (type === 'cleaner') {
    user = await Cleaner.findById(_id);
  } else if (type === 'client') {
    user = await Client.findById(_id);
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

  return new NextResponse(
    JSON.stringify({ success: true, user: { ...user.toObject(), type } }),
    { status: 200 }
  );
}
