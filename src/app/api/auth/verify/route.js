import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
export const runtime = 'nodejs';
function json(data, status=200){ return NextResponse.json(data,{status}); }
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!token) return json({ success:false, message:'Missing token' }, 400);
  await dbConnect();
  const user = await User.findOne({ verificationToken: token, verificationExpires: { $gt: new Date() } });
  if (!user) return json({ success:false, message:'Invalid or expired token' }, 400);
  user.emailVerified = true; user.verificationToken = undefined; user.verificationExpires = undefined; await user.save();
  return json({ success:true, message:'Email verified' });
}
