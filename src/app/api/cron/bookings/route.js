import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Purchase from "@/models/Purchase";
import Client from "@/models/Client";
import Cleaner from "@/models/Cleaner";
import { parseAppointmentDate } from "@/lib/bookingDates";
import { sendBookingReminderEmail, sendReviewRequestEmail } from "@/lib/notifications";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET || '';
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req) {
  if (!isAuthorized(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const now = new Date();
  const reminderStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const reminderEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  const reviewStart = new Date(now.getTime() - 25 * 60 * 60 * 1000);
  const reviewEnd = new Date(now.getTime() - 23 * 60 * 60 * 1000);

  const rows = await Purchase.find({
    status: { $in: ['accepted', 'approved', 'booked', 'confirmed'] },
  }).lean();

  let reminders = 0;
  let reviews = 0;
  let expiries = 0;

  for (const row of rows) {
    const appointmentAt = row.appointmentAt ? new Date(row.appointmentAt) : parseAppointmentDate(row);
    if (!appointmentAt || Number.isNaN(appointmentAt.getTime())) continue;

    const updates = {};
    if (!row.appointmentAt) updates.appointmentAt = appointmentAt;
    if (!row.completedAt && appointmentAt.getTime() < now.getTime()) updates.completedAt = appointmentAt;
    if (!row.expiresAt && appointmentAt.getTime() < now.getTime() - 14 * 24 * 60 * 60 * 1000) {
      updates.expiresAt = new Date(appointmentAt.getTime() + 14 * 24 * 60 * 60 * 1000);
      expiries += 1;
    }

    const [client, cleaner] = await Promise.all([
      row.clientId ? Client.findById(row.clientId).lean() : null,
      row.cleanerId ? Cleaner.findById(row.cleanerId).lean() : null,
    ]);

    if (!row.clientReminderSentAt && appointmentAt >= reminderStart && appointmentAt <= reminderEnd) {
      try {
        await sendBookingReminderEmail({
          to: client?.email || row.guestEmail,
          recipientName: client?.fullName || row.guestName,
          cleanerName: cleaner?.companyName || cleaner?.realName,
          clientName: client?.fullName || row.guestName,
          purchase: { ...row, _id: String(row._id) },
          role: 'client',
        });
        updates.clientReminderSentAt = new Date();
        reminders += 1;
      } catch (error) {
        console.error('[cron:client-reminder] failed', { purchaseId: String(row._id), message: error?.message });
      }
    }

    if (!row.cleanerReminderSentAt && appointmentAt >= reminderStart && appointmentAt <= reminderEnd) {
      try {
        await sendBookingReminderEmail({
          to: cleaner?.email,
          recipientName: cleaner?.realName || cleaner?.companyName,
          cleanerName: cleaner?.companyName || cleaner?.realName,
          clientName: client?.fullName || row.guestName,
          purchase: { ...row, _id: String(row._id) },
          role: 'cleaner',
        });
        updates.cleanerReminderSentAt = new Date();
        reminders += 1;
      } catch (error) {
        console.error('[cron:cleaner-reminder] failed', { purchaseId: String(row._id), message: error?.message });
      }
    }

    if (!row.reviewRequestSentAt && !row.reviewSubmittedAt && appointmentAt >= reviewStart && appointmentAt <= reviewEnd) {
      try {
        await sendReviewRequestEmail({
          to: client?.email || row.guestEmail,
          recipientName: client?.fullName || row.guestName,
          cleanerName: cleaner?.companyName || cleaner?.realName,
          purchase: { ...row, _id: String(row._id) },
        });
        updates.reviewRequestSentAt = new Date();
        if (!updates.completedAt) updates.completedAt = appointmentAt;
        reviews += 1;
      } catch (error) {
        console.error('[cron:review-request] failed', { purchaseId: String(row._id), message: error?.message });
      }
    }

    if (Object.keys(updates).length) {
      await Purchase.updateOne({ _id: row._id }, { $set: updates });
    }
  }

  return NextResponse.json({ success: true, reminders, reviews, expiries, scanned: rows.length });
}
