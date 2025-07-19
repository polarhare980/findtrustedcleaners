import { connectToDatabase } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/auth';
import { serialize } from 'cookie';
import mongoose from 'mongoose'; // ✅ Add this
import { NextResponse } from 'next/server';

export async function POST(req) {
  await connectToDatabase();
  console.log('✅ Client Register route hit');

  try {
    const body = await req.json();
    const {
      fullName,
      email,
      password,
      phone,
      houseNameNumber,
      street,
      county,
      postcode,
    } = body;

    if (!email || !password || !fullName || !phone || !postcode) {
      return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // ✅ Use Mongoose to access native collection
    const existing = await mongoose.connection.db.collection('clients').findOne({ email: trimmedEmail });

    if (existing) {
      return NextResponse.json({ success: false, message: 'Client already exists.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const newClient = {
      fullName: fullName.trim(),
      email: trimmedEmail,
      password: hashedPassword,
      phone: phone.trim(),
      address: {
        houseNameNumber,
        street,
        county,
        postcode,
      },
      createdAt: new Date(),
    };

    const result = await mongoose.connection.db.collection('clients').insertOne(newClient);
    console.log('✅ Client saved to MongoDB:', result.insertedId.toString());

    return sendCookie(result.insertedId.toString(), 'client');
  } catch (err) {
    console.error('❌ Client Registration Error:', err);
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
