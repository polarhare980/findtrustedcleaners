import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;

export function createToken(payload) {
  return jwt.sign(
    { ...payload, _id: payload._id?.toString?.() || payload._id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ✅ For API routes — returns JSON on failure
export async function protectApiRoute(req) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = parse(cookieHeader);
  const token = cookies.token;

  if (!token) {
    return {
      valid: false,
      user: null,
      response: NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 }),
    };
  }

  const user = verifyToken(token);

  if (!user) {
    return {
      valid: false,
      user: null,
      response: NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 }),
    };
  }

  return { valid: true, user };
}

// ✅ Optional: for pages — redirects to login
export async function protectRoute(req) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = parse(cookieHeader);
  const token = cookies.token;

  if (!token) {
    return {
      valid: false,
      response: NextResponse.redirect('/login'),
    };
  }

  const user = verifyToken(token);

  if (!user) {
    return {
      valid: false,
      response: NextResponse.redirect('/login'),
    };
  }

  return { valid: true, user };
}
