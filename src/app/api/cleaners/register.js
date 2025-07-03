import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';
import { createToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { serialize } from 'cookie';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await connectToDatabase();

  try {
    const { realName, companyName, email, password, phone, rates, services, address } = await req.json();

    // Validate input
    if (
      !realName?.trim() ||
      !companyName?.trim() ||
      !email?.trim() ||
      !password ||
      !phone?.trim() ||
      rates === undefined ||
      rates === '' ||
      !Array.isArray(services) || services.length === 0 ||
      !address?.houseNameNumber?.trim() ||
      !address?.street?.trim() ||
      !address?.county?.trim() ||
      !address?.postcode?.trim()
    ) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'All fields are required.' }),
        { status: 400 }
      );
    }

    // Check if cleaner already exists
    const existingCleaner = await Cleaner.findOne({ email: email.trim().toLowerCase() });
    if (existingCleaner) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Cleaner already exists.' }),
        { status: 409 } // Conflict
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new cleaner
    const newCleaner = new Cleaner({
      realName,
      companyName,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone,
      rates,
      services,
      address,
    });

    await newCleaner.save();

    // 🔐 Create login token
    const stringifiedUserId = newCleaner._id.toString();
    const token = createToken({ _id: stringifiedUserId, type: 'cleaner' });

    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log('✅ Cleaner registered and logged in:', stringifiedUserId);

    return new NextResponse(
      JSON.stringify({ success: true, id: stringifiedUserId, type: 'cleaner' }),
      {
        status: 200,
        headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Error during cleaner registration:', err);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500 }
    );
  }
}
