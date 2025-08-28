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
    const trimmedEmail = email?.trim().toLowerCase();

    console.log('📥 Login attempt:', { email, trimmedEmail, password, userType });

    if (!email || !password || !userType) {
      console.log('⚠️ Missing fields');
      return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
    }

    let user;

    if (userType === 'cleaner') {
      user = await Cleaner.findOne({ email: trimmedEmail });
    } else if (userType === 'client') {
      user = await Client.findOne({ email: trimmedEmail });
    } else {
      console.log('❌ Invalid userType:', userType);
      return NextResponse.json({ success: false, message: 'Invalid user type.' }, { status: 400 });
    }

    if (!user) {
      console.log('❌ No user found for email:', trimmedEmail);
      return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 });
    }

    console.log('🧪 Found user:', user.email);
    console.log('🔐 Hashed password in DB:', user.password);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔐 Password match:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Incorrect password for user:', trimmedEmail);
      return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 });
    }

    const token = createToken({ _id: user._id.toString(), type: userType });
    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log('✅ Login success for:', user._id.toString());

    const response = NextResponse.json(
      { success: true, id: user._id.toString(), type: userType },
      { status: 200 }
    );
    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (err) {
    console.error('❌ Login error:', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
