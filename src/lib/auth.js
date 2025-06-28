import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'pepsi';

// ✅ Create a JWT token
export function createToken(payload) {
  if (!process.env.JWT_SECRET) throw Error('JWT_SECRET not defined');
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// ✅ Verify the token from cookies
export async function verifyToken() {
  try {
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) throw new Error('No token provided');

    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    if (!tokenMatch) throw new Error('No token provided');

    const token = tokenMatch[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    return decoded; // ✅ return the decoded user info
  } catch (err) {
    console.error('❌ JWT verification error:', err.message);
    return null;
  }
}
