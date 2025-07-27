import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;

// 🔐 Ensure secret is defined
if (!JWT_SECRET) {
  throw new Error('❌ JWT_SECRET is not defined in environment variables');
}

// ✅ Create a JWT token (used on login/register)
export function createToken(payload) {
  return jwt.sign(
    { ...payload, _id: payload._id?.toString?.() || payload._id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ✅ Verify a JWT token — returns decoded payload or null
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('🔐 JWT verification failed:', err.message);
    }
    return null;
  }
}

// 🧩 Extract token from request cookies
function getTokenFromRequest(req) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = parse(cookieHeader);
  return cookies.token;
}

// ✅ For API routes — returns JSON if invalid
export async function protectApiRoute(req, expectedRole = null) {
  const token = getTokenFromRequest(req);

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
      response: NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 401 }),
    };
  }

  if (expectedRole && user?.type !== expectedRole) {
    return {
      valid: false,
      user: null,
      response: NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 }),
    };
  }

  return { valid: true, user };
}

// ✅ For App Router pages — redirects to login
export async function protectRoute(req, expectedRole = null) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return {
      valid: false,
      response: NextResponse.redirect(`/login?next=${encodeURIComponent(req.nextUrl.pathname)}`),
    };
  }

  const user = verifyToken(token);

  if (!user) {
    return {
      valid: false,
      response: NextResponse.redirect(`/login?next=${encodeURIComponent(req.nextUrl.pathname)}`),
    };
  }

  if (expectedRole && user?.type !== expectedRole) {
    return {
      valid: false,
      response: NextResponse.redirect(`/unauthorized`),
    };
  }

  return { valid: true, user };
}
