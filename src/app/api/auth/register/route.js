import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import bcrypt from 'bcryptjs';
import { createToken } from '@/lib/auth';
import { serialize } from 'cookie';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await connectToDatabase();
  console.log('✅ Register route hit');

  try {
    const body = await req.json();
    const { userType, email, password } = body;

    console.log('📥 Received data:', body);

    if (!email || !password || !userType) {
      console.log('❌ Missing basic fields');
      return NextResponse.json({ success: false, message: 'Email, password, and user type are required.' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    let existingUser;

    if (userType === 'cleaner') {
      existingUser = await Cleaner.findOne({ email: trimmedEmail });

      if (existingUser) {
        console.log('❌ Cleaner already exists');
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

      await newCleaner.save();
      return sendCookie(newCleaner._id.toString(), 'cleaner');

    } else if (userType === 'client') {
      existingUser = await Client.findOne({ email: trimmedEmail });

      if (existingUser) {
        console.log('❌ Client already exists');
        return NextResponse.json({ success: false, message: 'Client already exists.' }, { status: 409 });
      }

      const { fullName, phone, houseNameNumber, street, county, postcode } = body;

      if (!fullName || !phone || !houseNameNumber || !street || !county || !postcode) {
        return NextResponse.json({ success: false, message: 'All client fields are required.' }, { status: 400 });
      }

      const newClient = new Client({
        fullName: fullName.trim(),
        email: trimmedEmail,
        password: hashedPassword,
        phone: phone.trim(),
        address: { houseNameNumber, street, county, postcode },
      });

      await newClient.save();
      return sendCookie(newClient._id.toString(), 'client');

    } else {
      return NextResponse.json({ success: false, message: 'Invalid user type.' }, { status: 400 });
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
