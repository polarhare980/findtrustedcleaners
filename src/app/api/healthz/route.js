import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
export const runtime = 'nodejs';
export async function GET() {
  try { await dbConnect(); return NextResponse.json({ ok:true, db:'ok' }); }
  catch(e){ return NextResponse.json({ ok:false, db:'error', error: String(e) }, { status: 500 }); }
}
