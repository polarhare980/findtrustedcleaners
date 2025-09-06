import { limiter } from '@/middleware/rateLimiter';
import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import Cleaner from '@/models/Cleaner';
import { createToken } from '@/lib/auth';
import { serialize } from 'cookie';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await connectToDatabase();

  try {
    const remaining = await limiter.check(req, 5, 'LOGIN_LIMIT').catch(() => null);
    console.log('Remaining attempts:', remaining); // Debugging rate limit
    if (remaining !== null && remaining <= 0) {
      return NextResponse.json({ success: false, message: 'Too many login attempts, please try later.' }, { status: 429 });
    }

    const body = await req.json();
    const { email, password, userType } = body;

    if (!email || !password || !userType) {
      console.error('❌ Missing fields:', { email, password, userType });
      return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
    }

    if (!['client', 'cleaner'].includes(userType)) {
      console.error('❌ Invalid user type:', userType);
      return NextResponse.json({ success: false, message: 'Invalid user type.' }, { status: 400 });
    }

    const Model = userType === 'client' ? Client : Cleaner;

    const user = await Model.findOne({ email });

    if (!user) {
      console.warn(`❌ User not found for email: ${email} as ${userType}`);
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', passwordMatch); // Debugging password match

    if (!passwordMatch) {
      console.warn(`❌ Password mismatch for email: ${email} as ${userType}`);
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    const token = createToken({ id: user._id, type: userType });

    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log('Token:', token); // Debugging token creation
    console.log('Cookie:', cookie); // Debugging cookie

    return new NextResponse(JSON.stringify({ success: true, id: user._id, type: userType }), {
      status: 200,
      headers: {
        'Set-Cookie': cookie,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    return NextResponse.json({ success: false, message: 'Server error, please try again.' }, { status: 500 });
  }
}
