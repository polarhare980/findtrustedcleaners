import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// 🔒 Example Secret (replace in production)
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

// ✅ Corrected Protect Route
export async function protectRoute(req) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return {
      valid: false,
      response: new NextResponse(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401 }),
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
