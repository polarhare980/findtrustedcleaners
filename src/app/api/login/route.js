import { limiter } from '@/middleware/rateLimiter';
import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import Cleaner from '@/models/Cleaner';
import { createToken } from '@/lib/auth';
import { serialize } from 'cookie';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  await connectToDatabase();

  try {
    const { email, password, userType } = await req.json();
    const Model = userType === 'client' ? Client : Cleaner;
    const user = await Model.findOne({ email });

    if (!user) {
      return Response.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    // ✅ Compare hashed passwords
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return Response.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    // ✅ Create JWT token
    const token = createToken({ id: user._id, type: userType });

    // ✅ Secure httpOnly cookie
    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log(`✅ ${userType} Login Success, ID:`, user._id);

    return new Response(JSON.stringify({ success: true, id: user._id }), {
      status: 200,
      headers: {
        'Set-Cookie': cookie,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    return Response.json({ success: false, message: 'Server error, please try again.' }, { status: 500 });
  }
}
