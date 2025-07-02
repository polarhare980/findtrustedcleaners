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
    console.log('📥 Raw email length:', email.length);
    console.log('📥 Email with quotes:', `"${email}"`);

    if (!email || !password || !userType) {
      console.log('❌ Missing fields');
      return new NextResponse(
        JSON.stringify({ success: false, message: 'All fields are required.' }),
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase(); // Make case-insensitive
    console.log('🔍 Searching with trimmed/lowercase email:', `"${trimmedEmail}"`);

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

    // First, let's see ALL users in the collection
    const allUsers = await Model.find({});
    console.log('🗃️ Total users in collection:', allUsers.length);
    console.log('🗃️ All emails in database:', allUsers.map(u => `"${u.email}"`));

    // Try different query approaches
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

    console.log('👤 User found after all attempts:', user ? 'YES' : 'NO');
    
    if (user) {
      console.log('👤 Found user details:', { 
        id: user._id, 
        email: `"${user.email}"`,
        emailLength: user.email.length,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0
      });
    } else {
      // If still not found, let's check if there are any similar emails
      const similarEmails = await Model.find({
        email: { $regex: trimmedEmail.split('@')[0], $options: 'i' }
      });
      console.log('🔍 Similar emails found:', similarEmails.map(u => `"${u.email}"`));
    }

    if (!user) {
      console.log('❌ User not found after all attempts');
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
      // Let's also check if the password was hashed properly
      console.log('🔐 Stored hash starts with $2b?', user.password.startsWith('$2b'));
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
      JSON.stringify({ success: true, id: user._id, type: userType }),
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