// /app/api/dev/seed-cleaner/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cleaner from '@/models/Cleaner';
import bcrypt from 'bcryptjs';

export async function GET() {
  await dbConnect();
  const hashed = await bcrypt.hash('test123', 10);

  const cleaner = await Cleaner.create({
    realName: 'Test Cleaner',
    email: 'test@cleaner.com',
    password: hashed,
    phone: '07000111222',
    postcode: 'XYZ 123',
    premium: true,
  });

  return NextResponse.json({ success: true, cleaner });
}
