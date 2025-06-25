import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  await connectToDatabase();
  const { email, password } = await req.json();

  // 🔍 Find the client by email
  const client = await Client.findOne({ email });

  if (!client) {
    return new Response(JSON.stringify({ message: 'Email not found' }), { status: 404 });
  }

  // 🔐 Compare hashed passwords
  const passwordMatch = await bcrypt.compare(password, client.password);

  if (!passwordMatch) {
    return new Response(JSON.stringify({ message: 'Incorrect password' }), { status: 401 });
  }

  // ✅ Generate JWT token
  const token = jwt.sign(
    { id: client._id, userType: 'client' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('✅ Client Login Success, ID:', client._id);

  // ✅ Return token and user ID
  return new Response(JSON.stringify({ token, id: client._id, userType: 'client' }), { status: 200 });
}
