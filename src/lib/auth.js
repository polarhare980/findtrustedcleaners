import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

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

// ✅ Protect Route (Correct format for your existing routes)
export async function protectRoute() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return { error: 'Unauthorized' };
  }

  const user = verifyToken(token);

  if (!user) {
    return { error: 'Invalid or expired token' };
  }

  return { user };
}
