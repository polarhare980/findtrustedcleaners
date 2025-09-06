import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Subscriber from '@/models/Subscriber';
export const runtime = 'nodejs';
function json(data, status=200){ return NextResponse.json(data,{status}); }
export async function GET(req) {
  const { searchParams } = new URL(req.url); const token = searchParams.get('token'); if (!token) return json({ success:false, message:'Missing token' }, 400);
  await dbConnect(); const sub = await Subscriber.findOne({ verifyToken: token, verifyExpires: { $gt: new Date() } });
  if (!sub) return json({ success:false, message:'Invalid or expired token' }, 400);
  sub.verified = true; sub.verifyToken = undefined; sub.verifyExpires = undefined; await sub.save();
  return json({ success:true, message:'Subscription confirmed' });
}
