import dbConnect from "@/lib/dbConnect";
import Cleaner from "@/models/Cleaner";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

// GET - Fetch single cleaner by ID or all cleaners (💬 Public)
export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      // ✅ Return a single cleaner by ID (password excluded)
      const cleaner = await Cleaner.findById(id).select('-password');
      if (!cleaner) {
        return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, cleaner }, { status: 200 });
    } else {
      // ✅ Return all cleaners (password excluded)
      const cleaners = await Cleaner.find({}, '-password');
      return NextResponse.json({ success: true, cleaners }, { status: 200 });
    }
  } catch (err) {
    console.error('❌ GET cleaner error:', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch cleaner(s).' }, { status: 500 });
  }
}

// POST - Register new cleaner (💬 Public)
export async function POST(req) {
  await dbConnect();
  const data = await req.json();
  console.log('👉 Received cleaner data:', data);

  try {
    const existing = await Cleaner.findOne({ email: data.email });

    if (existing) {
      console.log('⚠️ Email already registered:', data.email);
      return NextResponse.json({ success: false, message: 'Email already in use.' }, { status: 400 });
    }

    // ✅ Hash the password before saving
    const hashedPassword = await bcrypt.hash(data.password, 10);
    data.password = hashedPassword;

    const cleaner = await Cleaner.create(data);
    console.log('✅ Cleaner created:', cleaner._id);

    return NextResponse.json({ success: true, id: cleaner._id }, { status: 201 });
  } catch (err) {
    console.error('❌ Error creating cleaner:', err.message);
    return NextResponse.json({ success: false, message: 'Failed to create cleaner.' }, { status: 500 });
  }
}

