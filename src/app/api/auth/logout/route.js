import { NextResponse } from 'next/server';
import { clearAuthCookieOnResponse } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const res = NextResponse.json({ success: true });
  clearAuthCookieOnResponse(res);
  return res;
}
