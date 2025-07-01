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

    // Trim inputs to remove accidental spaces
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Check if user already exists
    let existingUser;
    if (userType === 'cleaner') {
      existingUser = await Cleaner.findOne({ email: trimmedEmail });
    } else if (userType === 'client') {
      existingUser = await Client.findOne({ email: trimmedEmail });
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

    // ✅ Hash the password here
    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

    // Save the user with hashed password
    let newUser;
    if (userType === 'cleaner') {
      newUser = new Cleaner({ email: trimmedEmail, password: hashedPassword });
    } else if (userType === 'client') {
      newUser = new Client({ email: trimmedEmail, password: hashedPassword });
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
