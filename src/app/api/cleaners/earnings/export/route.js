// app/api/cleaner/earnings/export/route.js
import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Booking from '@/models/booking';
import Cleaner from '@/models/Cleaner';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid || user.type !== 'cleaner') return response;

  const cleaner = await Cleaner.findById(user._id);
  if (!cleaner?.isPremium) {
    return NextResponse.json({ success: false, message: 'Premium access required' }, { status: 403 });
  }

  const bookings = await Booking.find({ cleanerId: user._id, status: 'accepted' });

  const csvRows = [
    ['Date', 'Amount (£)', 'Client ID', 'Status'],
    ...bookings.map((b) => [
      new Date(b.createdAt).toLocaleDateString(),
      b.amount.toFixed(2),
      b.clientId?.toString(),
      b.status,
    ])
  ];

  const csv = csvRows.map(row => row.join(',')).join('\n');

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=earnings.csv',
    },
  });
}
