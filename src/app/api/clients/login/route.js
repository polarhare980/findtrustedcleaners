import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

export async function POST(req) {
  await connectToDatabase();
  const { email, password } = await req.json();

  try {
    // 🔍 Find the client by email
    const client = await Client.findOne({ email });

    if (!client) {
      return new Response(JSON.stringify({ success: false, message: 'Email not found' }), { status: 404 });
    }

    // 🔐 Compare hashed passwords
    const passwordMatch = await bcrypt.compare(password, client.password);

    if (!passwordMatch) {
      return new Response(JSON.stringify({ success: false, message: 'Incorrect password' }), { status: 401 });
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: client._id, type: 'client' }, // 👈 Match `type` for your auth checks
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Client Login Success, ID:', client._id);

    // ✅ Set token in httpOnly cookie
    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return new Response(JSON.stringify({ success: true, id: client._id, type: 'client' }), {
      status: 200,
      headers: {
        'Set-Cookie': cookie,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('❌ Client Login Error:', err.message);
    return new Response(JSON.stringify({ success: false, message: 'Server error' }), { status: 500 });
  }
}
