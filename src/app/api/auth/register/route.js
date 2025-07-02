import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await connectToDatabase();
  console.log('✅ Register route hit');

  try {
    const { email, password, userType, fullName, phone, houseNameNumber, street, county, postcode } = await req.json();
    console.log('📥 Received data:', { email, password, userType, fullName, phone, houseNameNumber, street, county, postcode });

    if (!email || !password || !userType || !fullName || !phone || !houseNameNumber || !street || !county || !postcode) {
      console.log('❌ Missing fields');
      return new NextResponse(
        JSON.stringify({ success: false, message: 'All fields are required.' }),
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    console.log('✂️ Trimmed data:', { trimmedEmail, trimmedPassword, userType });

    let existingUser;
    if (userType === 'cleaner') {
      existingUser = await Cleaner.findOne({ email: trimmedEmail });
    } else if (userType === 'client') {
      existingUser = await Client.findOne({ email: trimmedEmail });
    } else {
      console.log('❌ Invalid user type');
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid user type.' }),
        { status: 400 }
      );
    }

    if (existingUser) {
      console.log('❌ User already exists');
      return new NextResponse(
        JSON.stringify({ success: false, message: 'User already exists.' }),
        { status: 409 }
      );
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
    console.log('✅ Password hashed:', hashedPassword);

    let newUser;
    if (userType === 'cleaner') {
      newUser = new Cleaner({ email: trimmedEmail, password: hashedPassword });
    } else if (userType === 'client') {
      newUser = new Client({
        fullName,
        phone,
        email: trimmedEmail,
        password: hashedPassword,
        address: {
          houseNameNumber,
          street,
          county,
          postcode,
        },
      });
    }

    console.log('💾 Saving user...');
    await newUser.save();
    console.log('✅ User saved successfully');

    return new NextResponse(
      JSON.stringify({ success: true, message: 'User registered successfully.' }),
      { status: 201 }
    );
  } catch (err) {
    console.error('❌ Registration error:', err);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Server error.' }),
      { status: 500 }
    );
  }
}
