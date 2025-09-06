// GET /api/cleaners/[id]/pending
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data, status=200){ return NextResponse.json(data, { status }); }

export async function GET(_req, { params }){
  const { id } = params || {};
  if (!id) return json({ success:false, message:'Cleaner id required' }, 400);
  try {
    await connectToDatabase();
    const purchases = await Purchase.find({ cleanerId: id, status: 'pending' }).sort({ createdAt: -1 }).lean();
    return json({ success:true, purchases });
  } catch (e) {
    console.error('GET /api/cleaners/[id]/pending failed', e);
    return json({ success:false, message:'Server error' }, 500);
  }
}
