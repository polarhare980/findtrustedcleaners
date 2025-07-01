// File: app/api/auth/register/route.js

import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await connectToDatabase();

  try {
    const { email, password, userType } = await req.json();

    // Validate input
    if (!email || !password || !userType) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'All fields are required.' }),
        { status: 400 }
      );
    }

    // Check if user already exists
    let existingUser;
    if (userType === 'cleaner') {
      existingUser = await Cleaner.findOne({ email });
    } else if (userType === 'client') {
      existingUser = await Client.findOne({ email });
    } else {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid user type.' }),
        { status: 400 }
      );
    }

    if (existingUser) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'User already exists.' }),
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the new user
    let newUser;
    if (userType === 'cleaner') {
      newUser = new Cleaner({ email, password: hashedPassword });
    } else if (userType === 'client') {
      newUser = new Client({ email, password: hashedPassword });
    }

    await newUser.save();

    return new NextResponse(
      JSON.stringify({ success: true, message: 'User registered successfully.' }),
      { status: 201 }
    );
  } catch (err) {
    console.error('Registration error:', err);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Server error.' }),
      { status: 500 }
    );
  }
}


