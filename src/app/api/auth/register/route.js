import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/auth';
import { serialize } from 'cookie';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await connectToDatabase();
  console.log('✅ Cleaner Register route hit');

  try {
    const body = await req.json();
    const { userType, email, password } = body;

    if (userType !== 'cleaner') {
      return NextResponse.json({ success: false, message: 'Only cleaner registration is handled here.' }, { status: 400 });
    }

    console.log('📥 Cleaner registration payload:', body);

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const existingCleaner = await Cleaner.findOne({ email: trimmedEmail });

    if (existingCleaner) {
      console.log('❌ Cleaner already exists:', trimmedEmail);
      return NextResponse.json({ success: false, message: 'Cleaner already exists.' }, { status: 409 });
    }

    const {
      realName,
      companyName,
      phone,
      rates,
      services,
      houseNameNumber,
      street,
      county,
      postcode,
      availability,
      businessInsurance
    } = body;

    if (!realName || !companyName || !phone || !rates || !services || !houseNameNumber || !street || !county || !postcode) {
      return NextResponse.json({ success: false, message: 'All cleaner fields are required.' }, { status: 400 });
    }

    const newCleaner = new Cleaner({
      realName: realName.trim(),
      companyName: companyName.trim(),
      email: trimmedEmail,
      password: hashedPassword,
      phone: phone.trim(),
      rates,
      services,
      houseNameNumber,
      street,
      county,
      postcode,
      availability,
      businessInsurance,
    });

    try {
      const savedCleaner = await newCleaner.save();
      console.log('✅ Cleaner saved to MongoDB:', savedCleaner._id.toString());
      return sendCookie(savedCleaner._id.toString(), 'cleaner');
    } catch (saveErr) {
      console.error('❌ Failed to save cleaner to MongoDB:', saveErr);
      return NextResponse.json({ success: false, message: 'Failed to save cleaner.' }, { status: 500 });
    }

  } catch (err) {
    console.error('❌ Registration error:', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

function sendCookie(userId, userType) {
  const token = createToken({ _id: userId, type: userType });

  const cookie = serialize('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return new NextResponse(JSON.stringify({ success: true, id: userId, type: userType }), {
    status: 201,
    headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' },
  });
}
