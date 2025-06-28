import dbConnect from "@/lib/dbConnect";
import Cleaner from "@/models/Cleaner";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

// GET - Fetch cleaner(s) with optional filters (💬 Public)
export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const postcode = searchParams.get('postcode') || '';
  const minRating = parseFloat(searchParams.get('minRating')) || 0;
  const bookingStatus = searchParams.get('bookingStatus') || 'all';

  try {
    // ✅ Return a single cleaner by ID
    if (id) {
      const cleaner = await Cleaner.findById(id).select('-password');
      if (!cleaner) {
        return NextResponse.json({ success: false, message: 'Cleaner not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, cleaners: [cleaner] }, { status: 200 }); // Always return array
    }

    // ✅ Build filter query
    const query = {};

    if (postcode) {
      query.postcode = { $regex: postcode, $options: 'i' };
    }

    if (minRating > 0) {
      query.rating = { $gte: minRating };
    }

    if (bookingStatus !== 'all') {
      query.bookingStatus = bookingStatus;
    }

    // ✅ Return all matching cleaners (password excluded)
    const cleaners = await Cleaner.find(query).select('-password');

    return NextResponse.json({ success: true, cleaners }, { status: 200 });
  } catch (err) {
    console.error('❌ GET cleaner error:', err.message);
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
