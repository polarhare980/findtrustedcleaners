import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/client.js'; // ✅ using your actual model name
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/auth';
import { serialize } from 'cookie';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await connectToDatabase();
  console.log('✅ Unified Register route hit');

  try {
    const body = await req.json();
    console.log('📨 Incoming registration payload:', body);

    const { userType, email, password } = body;

    if (!userType || !email || !password) {
      return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // ✅ CLEANER REGISTRATION
    if (userType === 'cleaner') {
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
        businessInsurance,
      } = body;

      if (!realName || !companyName || !phone || !rates || !services || !houseNameNumber || !street || !county || !postcode) {
        return NextResponse.json({ success: false, message: 'All cleaner fields are required.' }, { status: 400 });
      }

      const existingCleaner = await Cleaner.findOne({ email: trimmedEmail });

      if (existingCleaner) {
        console.log('❌ Cleaner already exists:', trimmedEmail);
        return NextResponse.json({ success: false, message: 'Cleaner already exists.' }, { status: 409 });
      }

      const hashedPassword = await bcrypt.hash(password.trim(), 10);

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

      const savedCleaner = await newCleaner.save();
      console.log('✅ Cleaner saved:', savedCleaner._id.toString());
      return sendCookie(savedCleaner._id.toString(), 'cleaner');
    }

    // ✅ CLIENT REGISTRATION
    if (userType === 'client') {
      const {
        fullName,
        phone,
        houseNameNumber,
        street,
        county,
        postcode,
      } = body;

      if (!fullName || !phone || !houseNameNumber || !street || !county || !postcode) {
        return NextResponse.json({ success: false, message: 'All client fields are required.' }, { status: 400 });
      }

      const existingClient = await Client.findOne({ email: trimmedEmail });
      if (existingClient) {
        console.log('❌ Client already exists:', trimmedEmail);
        return NextResponse.json({ success: false, message: 'Client already exists.' }, { status: 409 });
      }

      const newClient = new Client({
        fullName: fullName.trim(),
        email: trimmedEmail,
        password: password.trim(), // ✅ hash will be handled by the `pre('save')` middleware
        phone: phone.trim(),
        address: {
          houseNameNumber: houseNameNumber.trim(),
          street: street.trim(),
          county: county.trim(),
          postcode: postcode.trim(),
        },
      });

      const savedClient = await newClient.save();
      console.log('✅ Client saved:', savedClient._id.toString());
      return sendCookie(savedClient._id.toString(), 'client');
    }

    return NextResponse.json({ success: false, message: 'Invalid user type.' }, { status: 400 });

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
