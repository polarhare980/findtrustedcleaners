import jwt from 'jsonwebtoken';

export async function verifyToken() {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No token provided.');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return decoded; // This will typically have user id and user type
  } catch (err) {
    console.error('❌ JWT verification error:', err.message);
    throw new Error('Invalid or expired token.');
  }
}
