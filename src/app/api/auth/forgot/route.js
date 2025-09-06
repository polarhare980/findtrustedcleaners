import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import crypto from 'crypto';
import { sendMail } from '@/lib/email';
import { renderEmail } from '@/lib/emailRender';
export const runtime = 'nodejs';
function json(data, status=200){ return NextResponse.json(data,{status}); }
export async function POST(req) {
  const { email } = await req.json();
  if (!email) return json({ success:false, message:'Missing email' }, 400);
  await dbConnect();
  const user = await User.findOne({ email });
  if (!user) return json({ success:true, message:'If that email exists, we sent a reset link' });
  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetToken = resetToken; user.resetExpires = new Date(Date.now() + 1000*60*60); await user.save();
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const url = `${base}/auth/reset?token=${resetToken}`;
  await sendMail({ to: email, subject: 'Reset your password', html: renderEmail('broadcast', { subject: 'Reset your password', content_html: `<p>Click <a href="${url}">here</a> to reset your password. Link expires in 1 hour.</p>` }) });
  return json({ success:true, message:'If that email exists, we sent a reset link' });
}
