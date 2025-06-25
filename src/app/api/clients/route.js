import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  await connectToDatabase();
  const data = await req.json();

  // ✅ Check if the email is already registered
  const existing = await Client.findOne({ email: data.email });
  if (existing) return Response.json({ success: false, message: 'Email already in use.' }, { status: 400 });

  // ✅ Hash the password before saving
  const hashedPassword = await bcrypt.hash(data.password, 10);
  data.password = hashedPassword;

  const client = await Client.create(data);
  return Response.json({ success: true, id: client._id });
}
