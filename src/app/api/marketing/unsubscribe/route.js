import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Subscriber from '@/models/Subscriber';
export const runtime = 'nodejs';
function json(data, status=200){ return NextResponse.json(data,{status}); }
export async function POST(req) {
  const { token, email } = await req.json(); if (!token && !email) return json({ success:false, message:'Provide token or email' }, 400);
  await dbConnect(); const q = token ? { unsubToken: token } : { email }; const sub = await Subscriber.findOne(q);
  if (!sub) return json({ success:true, message:'Unsubscribed' });
  sub.unsubscribed = true; await sub.save();
  return json({ success:true, message:'Unsubscribed' });
}
