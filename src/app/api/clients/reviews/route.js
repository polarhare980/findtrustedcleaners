import { NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';
import User from '@/models/User';
import { sendMail } from '@/lib/email';
import { renderEmail } from '@/lib/emailRender';
export const runtime = 'nodejs';
function json(data, status=200){ return NextResponse.json(data,{status}); }
export async function POST(req) {
  const { valid, user, response } = await protectApiRoute(req, ['client']);
  if (!valid) return response;
  const { cleanerId, purchaseId, rating, text } = await req.json();
  if (!cleanerId || !purchaseId || !rating) return json({ success:false, message:'Missing fields' }, 400);
  if (rating < 1 || rating > 5) return json({ success:false, message:'Invalid rating' }, 400);
  if (process.env.USE_DEMO_DATA === 'true') return json({ success:true, data: { _id:'rev_demo', cleanerId, clientId: user._id, rating, text } }, 201);
  await dbConnect();
  const p = await Purchase.findById(purchaseId);
  if (!p || String(p.clientId) !== String(user._id) || String(p.cleanerId) !== String(cleanerId)) return json({ success:false, message:'Not allowed' }, 403);
  if (!['accepted','booked'].includes(p.status)) return json({ success:false, message:'You can only review accepted/booked jobs' }, 400);
  const review = await Review.create({ cleanerId, clientId: user._id, purchaseId, rating, text });
  const agg = await Review.aggregate([{ $match: { cleanerId: review.cleanerId } }, { $group: { _id: '$cleanerId', avg: { $avg: '$rating' }, count: { $sum: 1 } } }]);
  const { avg=0, count=0 } = agg[0] || {}; await Cleaner.findByIdAndUpdate(cleanerId, { ratingAvg: avg, ratingCount: count });
  try { const u = await User.findById(user.uid); if (u?.email) { await sendMail({ to: u.email, subject: 'Thanks for your review', html: renderEmail('review-thanks', { subject: 'Thanks for your review', preheader: 'Thanks for your review' }) }); } } catch {}
  return json({ success:true, data: review }, 201);
}
