import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ResetToken from '@/models/ResetToken';
import Cleaner from '@/models/Cleaner';
import Client from '@/models/Client';
import { buildPasswordResetEmail, sendEmail } from '@/lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RESET_EXPIRY_MINUTES = 60;

function genericResponse() {
  return NextResponse.json({
    success: true,
    message: 'If an account exists for that email, a reset link has been sent.',
  });
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export async function POST(req) {
  await connectToDatabase();

  let email = '';
  try {
    const body = await req.json();
    email = normalizeEmail(body?.email);
  } catch {
    return genericResponse();
  }

  if (!email) return genericResponse();

  const [cleaner, client] = await Promise.all([
    Cleaner.findOne({ email }).select('_id email resetPasswordToken resetPasswordExpires').lean(),
    Client.findOne({ email }).select('_id email resetPasswordToken resetPasswordExpires').lean(),
  ]);

  const account = cleaner ? { ...cleaner, userType: 'cleaner' } : client ? { ...client, userType: 'client' } : null;
  if (!account?._id) return genericResponse();

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000);

  await ResetToken.deleteMany({ userId: account._id, userType: account.userType });
  await ResetToken.create({
    email,
    tokenHash,
    userType: account.userType,
    userId: account._id,
    expiresAt,
  });

  const Model = account.userType === 'cleaner' ? Cleaner : Client;
  await Model.updateOne(
    { _id: account._id },
    { $set: { resetPasswordToken: tokenHash, resetPasswordExpires: expiresAt } }
  );

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.findtrustedcleaners.com';
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const emailPayload = buildPasswordResetEmail({ resetUrl, expiresMinutes: RESET_EXPIRY_MINUTES });

  try {
    await sendEmail({ to: email, ...emailPayload });
  } catch (error) {
    console.error('[password-reset] email send failed', { email, userType: account.userType, message: error?.message || 'Unknown error' });
  }

  return genericResponse();
}
