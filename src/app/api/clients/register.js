import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import { createToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { serialize } from 'cookie';
import { NextResponse } from 'next/server';

export async function POST(req) {
  await connectToDatabase();

  try {
    const { fullName, email, password, phone, address } = await req.json();

    if (!fullName || !email || !password || !phone || !address) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'All fields are required' }),
        { status: 400 }
      );
    }

    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Client already exists' }),
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newClient = new Client({
      fullName,
      email,
      password: hashedPassword,
      phone,
      address,
    });

    await newClient.save();

    // 🔑 Create login token
    const stringifiedUserId = newClient._id.toString();
    const token = createToken({ _id: stringifiedUserId, type: 'client' });

    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log('✅ Client registered and logged in:', stringifiedUserId);

    return new NextResponse(
      JSON.stringify({ success: true, id: stringifiedUserId, type: 'client' }),
      {
        status: 200,
        headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Error during client registration:', err);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500 }
    );
  }
}
