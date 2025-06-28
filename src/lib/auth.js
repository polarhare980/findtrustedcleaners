import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// ✅ Require JWT_SECRET to be set
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET not defined in environment variables');
}

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Create a JWT token
export function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// ✅ Get and verify token using Next.js cookies API
export function verifyToken() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return null;

    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('❌ JWT verification error:', err.message);
    return null;
  }
}

// ✅ Middleware-style protection for API routes
export async function protectRoute() {
  const decoded = verifyToken();

  if (!decoded) {
    return { valid: false, response: NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 }) };
  }

  return { valid: true, user: decoded };
}
