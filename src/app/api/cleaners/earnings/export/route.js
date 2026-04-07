import { connectToDatabase } from '@/lib/db';
import { protectApiRoute } from '@/lib/auth';
import Purchase from '@/models/Purchase';
import Cleaner from '@/models/Cleaner';
import { NextResponse } from 'next/server';

export async function GET(req) {
  await connectToDatabase();

  const { valid, user, response } = await protectApiRoute(req);
  if (!valid) return response;
  if (user.type !== 'cleaner') {
    return NextResponse.json({ success: false, message: 'Access denied.' }, { status: 403 });
  }

  const cleaner = await Cleaner.findById(user._id).lean();
  if (!cleaner?.isPremium) {
    return NextResponse.json({ success: false, message: 'Premium access required' }, { status: 403 });
  }

  const purchases = await Purchase.find({ cleanerId: user._id, status: { $in: ['accepted', 'approved', 'booked', 'confirmed'] } }).lean();

  const csvRows = [
    ['Appointment', 'Amount (£)', 'Client', 'Status', 'Service'],
    ...purchases.map((p) => [
      p.isoDate || p.day || '',
      Number(p.amount || 0).toFixed(2),
      p.guestName || String(p.clientId || ''),
      p.status,
      p.serviceName || p.serviceKey || '',
    ])
  ];

  const csv = csvRows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=earnings.csv',
    },
  });
}
