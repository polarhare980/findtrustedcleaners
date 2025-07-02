import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';

// ✅ Create Token
export function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// ✅ Verify Token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// ✅ Protect Route: Read Token from Cookies (Next.js 13+ App Router Syntax)
export async function protectRoute() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return {
      valid: false,
      user: null,
      response: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }),
    };
  }

  const user = verifyToken(token);

  if (!user) {
    return {
      valid: false,
      user: null,
      response: NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 401 }),
    };
  }

  return { valid: true, user };
}
