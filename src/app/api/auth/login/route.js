import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import { createToken } from '@/lib/auth';
import { serialize } from 'cookie';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

// 💡 UTILITY FUNCTIONS

function getModel(userType) {
  if (userType === 'cleaner') return Cleaner;
  if (userType === 'client') return Client;
  return null;
}

async function findUser(Model, email) {
  // Try exact match first
  let user = await Model.findOne({ email });

  // Try case-insensitive if not found
  if (!user) {
    user = await Model.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
  }

  return user;
}

async function verifyPassword(enteredPassword, storedPassword) {
  return await bcrypt.compare(enteredPassword, storedPassword);
}

function createAuthCookie(token) {
  return serialize('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// 🚀 MAIN API HANDLER

export async function POST(req) {
  await connectToDatabase();
  console.log('✅ Login route hit');

  try {
    const { email, password, userType } = await req.json();
    console.log('📥 Login attempt:', { email, userType });

    if (!email || !password || !userType) {
      console.log('❌ Missing fields');
      return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const Model = getModel(userType);

    if (!Model) {
      console.log('❌ Invalid user type');
      return NextResponse.json({ success: false, message: 'Invalid user type.' }, { status: 400 });
    }

    console.log('🔍 Looking up user...');
    const user = await findUser(Model, trimmedEmail);

    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 });
    }

    console.log('🔐 Verifying password...');
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      console.log('❌ Incorrect password');
      return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 });
    }

    const stringifiedUserId = user._id.toString();
    const token = createToken({ _id: stringifiedUserId, type: userType });
    const cookie = createAuthCookie(token);

    console.log('✅ Login success for ID:', stringifiedUserId);

    return new NextResponse(JSON.stringify({ success: true, id: stringifiedUserId, type: userType }), {
      status: 200,
      headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
