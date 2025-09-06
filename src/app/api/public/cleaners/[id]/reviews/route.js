import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';
export const runtime = 'nodejs';
function json(data, status=200){ return NextResponse.json(data,{status}); }
export async function GET(_req, { params }) {
  const id = params?.id; if (!id) return json({ success:false, message:'Missing id' }, 400);
  if (process.env.USE_DEMO_DATA === 'true') return json({ success:true, data: [{ _id:'rev1', rating: 5, text: 'Brilliant job!', createdAt: new Date().toISOString() }] });
  await dbConnect();
  const rows = await Review.find({ cleanerId: id }, 'rating text createdAt').sort({ createdAt: -1 }).lean();
  return json({ success:true, data: rows || [] });
}
