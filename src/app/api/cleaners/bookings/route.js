// /app/api/cleaners/bookings/route.js

import { connectToDatabase } from '@/lib/db';
import Purchase from '@/models/Purchase';
import { protectApiRoute } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;

  if (user.type !== 'cleaner') {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  try {
    const rows = await Purchase.find({ cleanerId: user._id })
      .sort({ createdAt: -1 })
      .populate('clientId', 'fullName email phone')
      .lean();

    const bookings = (rows || []).map((p) => {
      const raw = String(p.status || 'pending').toLowerCase();

      const status =
        raw === 'accepted' || raw === 'confirmed' || raw === 'booked'
          ? 'accepted'
          : raw === 'declined' || raw === 'cancelled'
          ? 'rejected'
          : 'pending'; // includes pending_approval / approved / pending

      const hourNum = Number(p.hour);
      const time = Number.isFinite(hourNum) ? `${String(hourNum).padStart(2, '0')}:00` : '';

      return {
        _id: String(p._id),
        status,
        rawStatus: raw,
        day: p.day,
        hour: p.hour,
        time,
        amount: typeof p.amount === 'number' ? p.amount : null,
        serviceKey: p.serviceKey,
        serviceName: p.serviceName || '',
        span: Number(p.span || 1),
        createdAt: p.createdAt,
        clientId: p.clientId || null,
        customer: {
          name: p?.clientId?.fullName || p?.guestName || '',
          email: p?.clientId?.email || p?.guestEmail || '',
          phone: p?.clientId?.phone || p?.guestPhone || '',
        },
        notes: p?.notes || '',
        durationMins: Number(p?.durationMins || 0) || null,
      };
    });

    return NextResponse.json({ success: true, bookings });
  } catch (err) {
    console.error('❌ Error fetching purchases as bookings:', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}