import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Subscriber from '@/models/Subscriber';
import { sendMail } from '@/lib/email';
import { renderEmail } from '@/lib/emailRender';
import crypto from 'crypto';
export const runtime = 'nodejs';
function json(data, status=200){ return NextResponse.json(data,{status}); }
export async function POST(req) {
  const { email } = await req.json(); if (!email) return json({ success:false, message:'Email is required' }, 400);
  await dbConnect();
  let sub = await Subscriber.findOne({ email });
  const token = crypto.randomBytes(20).toString('hex'); const expires = new Date(Date.now() + 1000*60*60*48);
  if (!sub) sub = await Subscriber.create({ email, verifyToken: token, verifyExpires: expires, unsubToken: crypto.randomBytes(20).toString('hex') });
  else if (!sub.verified) { sub.verifyToken = token; sub.verifyExpires = expires; await sub.save(); }
  else if (sub.unsubscribed) { sub.unsubscribed = false; sub.verifyToken = token; sub.verifyExpires = expires; await sub.save(); }
  else return json({ success:true, message:'You are already subscribed' });
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'; const verifyUrl = `${base}/marketing/verify?token=${sub.verifyToken}`;
  await sendMail({ to: email, subject: 'Confirm your subscription', html: renderEmail('subscribe-confirm', { verify_url: verifyUrl, subject: 'Confirm your subscription', preheader: 'Please confirm your subscription' }) });
  return json({ success:true, message:'Check your email to confirm subscription.' });
}
