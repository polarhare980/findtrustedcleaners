import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// ✅ Example Secret (replace in production)
const JWT_SECRET = 'super_secret_debug_key';

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

// ✅ Stable Protect Route - Reads Cookie Directly
export async function protectRoute(req) {
  // Read cookies directly from request headers
  const cookieHeader = req.headers.get('cookie') || '';
  const tokenMatch = cookieHeader.match(/token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;

  if (!token) {
    return {
      valid: false,
      response: new NextResponse(JSON.stringify({ success: false, message: 'Unauthorized - No token' }), { status: 401 }),
    };
  }

  const user = verifyToken(token);

  if (!user) {
    return {
      valid: false,
      response: new NextResponse(JSON.stringify({ success: false, message: 'Invalid or expired token' }), { status: 401 }),
    };
  }

  return { valid: true, user };
}
