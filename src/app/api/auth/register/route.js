import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import bcrypt from 'bcryptjs';
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
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Email, password, and user type are required.' }),
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

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

    let newUser;

    if (userType === 'cleaner') {
      const { realName, companyName, phone, rates, services, address } = body;

      if (!realName || !companyName || !phone || !rates || !services || !address) {
        console.log('❌ Missing cleaner fields');
        return new NextResponse(
          JSON.stringify({ success: false, message: 'All cleaner fields are required.' }),
          { status: 400 }
        );
      }

      newUser = new Cleaner({
        realName,
        companyName,
        email: trimmedEmail,
        password: hashedPassword,
        phone,
        rates,
        services,
        address,
      });
    } else if (userType === 'client') {
      const { fullName, phone, houseNameNumber, street, county, postcode } = body;

      if (!fullName || !phone || !houseNameNumber || !street || !county || !postcode) {
        console.log('❌ Missing client fields');
        return new NextResponse(
          JSON.stringify({ success: false, message: 'All client fields are required.' }),
          { status: 400 }
        );
      }

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
