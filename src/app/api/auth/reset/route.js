import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
export const runtime = 'nodejs';
function json(data, status=200){ return NextResponse.json(data,{status}); }
export async function POST(req) {
  const { token, password } = await req.json();
  if (!token || !password) return json({ success:false, message:'Missing token or password' }, 400);
  await dbConnect();
  const user = await User.findOne({ resetToken: token, resetExpires: { $gt: new Date() } });
  if (!user) return json({ success:false, message:'Invalid or expired token' }, 400);
  user.passwordHash = await bcrypt.hash(password, 12); user.resetToken = undefined; user.resetExpires = undefined; await user.save();
  return json({ success:true, message:'Password updated' });
}
