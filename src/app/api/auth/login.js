import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import { createToken } from '@/lib/auth';
import { serialize } from 'cookie';

export async function POST(req) {
  await connectToDatabase();

  try {
    const { email, password, userType } = await req.json();

    if (!email || !password || !userType) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'All fields are required' }),
        { status: 400 }
      );
    }

    // Select the correct model based on userType
    let user;
    if (userType === 'cleaner') {
      user = await Cleaner.findOne({ email });
    } else if (userType === 'client') {
      user = await Client.findOne({ email });
    } else {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid user type' }),
        { status: 400 }
      );
    }

    // Check if the user exists
    if (!user) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid email or password' }),
        { status: 401 }
      );
    }

    // Compare entered password with stored password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid email or password' }),
        { status: 401 }
      );
    }

    // Create JWT Token
    const token = createToken({ id: user._id, type: userType });
    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return new NextResponse(
      JSON.stringify({ success: true, id: user._id }),
      {
        status: 200,
        headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500 }
    );
  }
}
