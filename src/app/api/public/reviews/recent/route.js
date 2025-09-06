import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';
import Cleaner from '@/models/Cleaner';
export const runtime = 'nodejs';
function json(data, status=200){ return NextResponse.json(data,{status}); }
export async function GET() {
  if (process.env.USE_DEMO_DATA === 'true') return json({ success:true, data: [
    { rating:5, text:'Amazing clean!', cleanerId:'c1', cleanerName:'Alice Johnson', slug:'alice-johnson', createdAt:new Date().toISOString() },
    { rating:4, text:'Great attention to detail.', cleanerId:'c2', cleanerName:'Ben Carter', slug:'ben-carter', createdAt:new Date().toISOString() }
  ]});
  await dbConnect();
  const rows = await Review.find({}, 'cleanerId rating text createdAt').sort({ createdAt: -1 }).limit(6).lean();
  const ids = Array.from(new Set(rows.map(r => String(r.cleanerId))));
  const cleaners = await Cleaner.find({ _id: { $in: ids }}, 'slug realName companyName').lean();
  const cmap = Object.fromEntries(cleaners.map(c => [String(c._id), { name: c.companyName || c.realName, slug: c.slug || String(c._id) }]));
  const data = rows.map(r => ({ rating:r.rating, text:r.text, createdAt:r.createdAt, cleanerId:String(r.cleanerId), cleanerName:cmap[String(r.cleanerId)]?.name || String(r.cleanerId), slug:cmap[String(r.cleanerId)]?.slug || String(r.cleanerId) }));
  return json({ success:true, data });
}
