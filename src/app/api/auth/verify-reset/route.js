import { connectToDatabase } from '@/lib/db';
import ResetToken from '@/models/ResetToken';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  await connectToDatabase();
  const { email, code, password, userType } = await req.json();

  const resetEntry = await ResetToken.findOne({ email, code });

  if (!resetEntry || resetEntry.expiresAt < new Date()) {
    return Response.json({ success: false, message: 'Invalid or expired code' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);

  if (userType === 'cleaner') {
    await Cleaner.updateOne({ email }, { password: hashed });
  } else {
    await Client.updateOne({ email }, { password: hashed });
  }

  await ResetToken.deleteMany({ email });

  return Response.json({ success: true, message: 'Password updated' });
}
