import { protectRoute } from '@/lib/auth';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import { NextResponse } from 'next/server';

export async function GET(req) {
  // Use the protectRoute function to validate the token
  const authResult = await protectRoute(req);

  if (authResult.error) {
    // If there's an error (e.g., invalid or missing token), return a 401 response
    return new NextResponse(
      JSON.stringify({ success: false, message: authResult.error }),
      { status: 401 }
    );
  }

  // Extract user data from decoded token
  const { id, type } = authResult.user; // id and type (cleaner or client) from token

  let user;
  // Depending on the user type, fetch the appropriate model
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

  // Return the user profile data if everything is valid
  return new NextResponse(
    JSON.stringify({ success: true, user }),
    { status: 200 }
  );
}
