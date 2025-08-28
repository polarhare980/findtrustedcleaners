// /app/api/dev/seed-cleaner/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cleaner from '@/models/Cleaner';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await dbConnect();

    const existing = await Cleaner.findOne({ email: 'test@cleaner.com' });
    if (existing) {
      return NextResponse.json({ success: true, message: 'Cleaner already exists', cleaner: existing });
    }

    const hashed = await bcrypt.hash('test123', 10);

    const cleaner = await Cleaner.create({
      realName: 'Test Cleaner',
      companyName: 'Test Cleaning Co', // ✅ Required field added
      email: 'test@cleaner.com',
      password: hashed,
      phone: '07000111222',
      postcode: 'XYZ 123',
      premium: true,
      rates: '25',
      availability: {},
      services: ['Oven Cleaning', 'End of Tenancy'],
      businessInsurance: true,
    });

    return NextResponse.json({ success: true, cleaner });
  } catch (err) {
    console.error('❌ Seeding error:', err);
    return NextResponse.json({ success: false, message: 'Seeder failed', error: err.message }, { status: 500 });
  }
}
