// File: /src/lib/auth.js
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

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

// ✅ Protect Route: Read Token from Cookies
export async function protectRoute(request) {
  const cookies = request.headers.get('cookie') || '';
  const parsedCookies = parse(cookies);
  const token = parsedCookies.token;

  if (!token) {
    return { error: 'Unauthorized' };
  }

  const user = verifyToken(token);

  if (!user) {
    return { error: 'Invalid or expired token' };
  }

  return { user };
}
