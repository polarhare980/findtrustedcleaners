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

    const trimmedEmail = email.trim().toLowerCase();
    console.log('🔍 Searching with email:', `"${trimmedEmail}"`);

    let user;
    let Model;

    if (userType === 'cleaner') {
      Model = Cleaner;
      console.log('🔍 Using Cleaner model');
    } else if (userType === 'client') {
      Model = Client;
      console.log('🔍 Using Client model');
    } else {
      console.log('❌ Invalid user type');
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid user type.' }),
        { status: 400 }
      );
    }

    console.log('🔍 Trying exact match...');
    user = await Model.findOne({ email: trimmedEmail });

    if (!user) {
      console.log('🔍 Trying case-insensitive regex...');
      user = await Model.findOne({
        email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') }
      });
    }

    if (!user) {
      console.log('🔍 Trying original email...');
      user = await Model.findOne({ email: email.trim() });
    }

    console.log('👤 User found:', user ? 'YES' : 'NO');

    if (!user) {
      console.log('❌ User not found');
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid email or password.' }),
        { status: 401 }
      );
    }

    console.log('🔐 Comparing password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔐 Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Incorrect password');
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid email or password.' }),
        { status: 401 }
      );
    }

    // ✅ Stringify user._id correctly
    const stringifiedUserId = user._id.toString();
    const token = createToken({ _id: stringifiedUserId, type: userType });

    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log('✅ Client Login Success, ID:', stringifiedUserId);

    return new NextResponse(
      JSON.stringify({ success: true, id: stringifiedUserId, type: userType }),
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
