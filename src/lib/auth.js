import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;

export function createToken(payload) {
  return jwt.sign({
    ...payload,
    _id: payload._id?.toString?.() || payload._id, // ✅ Ensure _id is always a string
  }, JWT_SECRET, { expiresIn: '7d' });
}


export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ✅ Updated secure version
export async function protectRoute(req) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = parse(cookieHeader);
  const token = cookies.token;

  if (!token) {
    return {
      valid: false,
      response: NextResponse.redirect('/login'), // redirect for pages
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
