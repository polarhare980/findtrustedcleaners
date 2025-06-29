// File: /src/lib/auth.js
import jwt from 'jsonwebtoken';

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

// ✅ Protect Route Example
export async function protectRoute(request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized' };
  }

  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  
  if (!user) {
    return { error: 'Invalid or expired token' };
  }

  return { user };
}
