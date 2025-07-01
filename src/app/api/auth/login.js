// File: app/api/auth/login/route.js

import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import { createToken } from '@/lib/auth';
import { serialize } from 'cookie';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await connectToDatabase();
  console.log('✅ Login route hit');

  try {
    const { email, password, userType } = await req.json();
    console.log('📥 Login attempt:', { email, userType });

    if (!email || !password || !userType) {
      console.log('❌ Missing fields');
      return new NextResponse(
        JSON.stringify({ success: false, message: 'All fields are required.' }),
        { status: 400 }
      );
    }

    let user;

    if (userType === 'cleaner') {
      user = await Cleaner.findOne({ email: email.trim() });
    } else if (userType === 'client') {
      user = await Client.findOne({ email: email.trim() });
    } else {
      console.log('❌ Invalid user type');
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid user type.' }),
        { status: 400 }
      );
    }

    if (!user) {
      console.log('❌ User not found');
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid email or password.' }),
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('❌ Incorrect password');
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid email or password.' }),
        { status: 401 }
      );
    }

    const token = createToken({ id: user._id, type: userType });

    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log('✅ Login successful, token created');

    return new NextResponse(
      JSON.stringify({ success: true, id: user._id }),
      {
        status: 200,
        headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('❌ Login error:', err);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Server error.' }),
      { status: 500 }
    );
  }
}
