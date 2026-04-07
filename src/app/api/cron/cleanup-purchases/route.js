import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Purchase from "@/models/Purchase";
import { parseAppointmentDate } from "@/lib/bookingDates";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET || '';
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();

  const now = new Date();
  const cutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const rows = await Purchase.find({
    status: { $in: ['accepted', 'approved', 'booked', 'confirmed', 'completed'] },
    expiresAt: null,
  }).lean();

  let stamped = 0;
  let scanned = 0;

  for (const row of rows) {
    scanned += 1;
    const appointmentAt = row.appointmentAt ? new Date(row.appointmentAt) : parseAppointmentDate(row);
    if (!appointmentAt || Number.isNaN(appointmentAt.getTime())) continue;
    if (appointmentAt > cutoff) continue;

    await Purchase.updateOne(
      { _id: row._id, expiresAt: null },
      { $set: { expiresAt: new Date(appointmentAt.getTime() + 14 * 24 * 60 * 60 * 1000) } }
    );
    stamped += 1;
  }

  return NextResponse.json({ success: true, scanned, stamped });
}
