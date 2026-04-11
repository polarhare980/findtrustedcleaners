import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { isAuthorizedCron, runBookingLifecycleSweep } from '@/lib/bookingLifecycleCron';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  await connectToDatabase();
  const result = await runBookingLifecycleSweep({ mode: 'reminders' });
  return NextResponse.json(result);
}
