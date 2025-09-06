import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';
export const runtime = 'nodejs';
export async function POST() { const res = NextResponse.json({ success:true }); clearAuthCookie(res); return res; }
