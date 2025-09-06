import { NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Cleaner from '@/models/Cleaner';
export const runtime = 'nodejs';
function json(data, status=200){ return NextResponse.json(data,{status}); }
export async function PATCH(req, { params }) {
  const { valid, response } = await protectApiRoute(req, ['admin']); if (!valid) return response;
  const id = params?.id; const body = await req.json(); if (!id) return json({ success:false, message:'Missing id' }, 400);
  await dbConnect();
  const update = {}; if (typeof body.slug === 'string') update.slug = body.slug.trim() || undefined; if (typeof body.isVisible === 'boolean') update.isVisible = body.isVisible;
  try { const saved = await Cleaner.findByIdAndUpdate(id, update, { new: true, runValidators: true }); if (!saved) return json({ success:false, message:'Not found' }, 404); return json({ success:true, data: { slug: saved.slug, isVisible: saved.isVisible } }); } catch (e) { return json({ success:false, message:e.message }, 400); }
}
