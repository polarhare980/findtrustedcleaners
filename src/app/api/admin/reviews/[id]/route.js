import { NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';
import Cleaner from '@/models/Cleaner';
export const runtime = 'nodejs';
function json(data, status=200){ return NextResponse.json(data,{status}); }
export async function DELETE(req, { params }) {
  const { valid, response } = await protectApiRoute(req, ['admin']); if (!valid) return response;
  const id = params?.id; if (!id) return json({ success:false, message:'Missing id' }, 400);
  await dbConnect();
  const rv = await Review.findByIdAndDelete(id); if (!rv) return json({ success:false, message:'Not found' }, 404);
  const agg = await Review.aggregate([{ $match: { cleanerId: rv.cleanerId } }, { $group: { _id: '$cleanerId', avg: { $avg: '$rating' }, count: { $sum: 1 } } }]);
  const { avg=0, count=0 } = agg[0] || {}; await Cleaner.findByIdAndUpdate(rv.cleanerId, { ratingAvg: avg, ratingCount: count });
  return json({ success:true });
}
