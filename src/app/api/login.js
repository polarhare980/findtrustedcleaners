import { limiter } from '@/middleware/rateLimiter';
import { signToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password, userType } = req.body;
  const db = (await clientPromise).db();

  const user = await db.collection(userType === 'client' ? 'clients' : 'cleaners').findOne({ email });

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // ✅ Compare hashed passwords
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // ✅ Generate JWT token
  const token = signToken({ id: user._id, email: user.email, userType });

  // ✅ Set httpOnly cookie securely
  res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict; Secure=${process.env.NODE_ENV === 'production'};`);

  console.log(`✅ ${userType} Login Success, ID:`, user._id);

  res.status(200).json({ success: true, id: user._id });
}
