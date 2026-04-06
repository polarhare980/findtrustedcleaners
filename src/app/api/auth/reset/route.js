import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ResetToken from '@/models/ResetToken';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req) {
  await connectToDatabase();

  const body = await req.json().catch(() => ({}));
  const token = String(body?.token || '').trim();
  const password = String(body?.password || '');

  if (!token || !password) {
    return json({ success: false, message: 'Missing token or password.' }, 400);
  }

  if (password.length < 8) {
    return json({ success: false, message: 'Password must be at least 8 characters.' }, 400);
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const resetRecord = await ResetToken.findOne({ tokenHash, expiresAt: { $gt: new Date() } });
  if (!resetRecord) {
    return json({ success: false, message: 'Invalid or expired reset link.' }, 400);
  }

  const Model = resetRecord.userType === 'cleaner' ? Cleaner : Client;
  const user = await Model.findById(resetRecord.userId);
  if (!user) {
    await ResetToken.deleteOne({ _id: resetRecord._id });
    return json({ success: false, message: 'Invalid or expired reset link.' }, 400);
  }

  const storedToken = String(user.resetPasswordToken || '');
  if (!storedToken || storedToken !== tokenHash || !user.resetPasswordExpires || user.resetPasswordExpires <= new Date()) {
    await ResetToken.deleteMany({ userId: resetRecord.userId, userType: resetRecord.userType });
    return json({ success: false, message: 'Invalid or expired reset link.' }, 400);
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = '';
  user.resetPasswordExpires = null;
  await user.save();

  await ResetToken.deleteMany({ userId: resetRecord.userId, userType: resetRecord.userType });

  return json({ success: true, message: 'Password updated successfully.' });
}
