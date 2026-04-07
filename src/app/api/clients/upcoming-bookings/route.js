import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { protectApiRoute } from "@/lib/auth";
import Purchase from "@/models/Purchase";
import { parseAppointmentDate, isUpcomingAppointment } from "@/lib/bookingDates";

const ACTIVE_STATUSES = ['accepted', 'approved', 'booked', 'confirmed', 'pending_approval'];

export async function GET(req) {
  await connectToDatabase();
  const { valid, user, response } = await protectApiRoute(req, 'client');
  if (!valid) return response;

  const rows = await Purchase.find({ clientId: user._id, status: { $in: ACTIVE_STATUSES } })
    .populate('cleanerId', 'realName companyName')
    .sort({ appointmentAt: 1, isoDate: 1, hour: 1, createdAt: -1 })
    .lean();

  const bookings = rows
    .map((row) => {
      const appointmentAt = row.appointmentAt ? new Date(row.appointmentAt) : parseAppointmentDate(row);
      return {
        ...row,
        _id: String(row._id),
        scheduledDateTime: appointmentAt ? appointmentAt.toISOString() : null,
        time: `${String(row.hour).padStart(2, '0')}:00`,
        service: row.serviceName || row.serviceKey || 'Cleaning service',
      };
    })
    .filter((row) => row.scheduledDateTime && isUpcomingAppointment(new Date(row.scheduledDateTime)));

  return NextResponse.json({ success: true, bookings });
}
